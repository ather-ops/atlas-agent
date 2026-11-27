import asyncio
import json
import logging
from contextlib import aclosing, suppress

from fastapi import HTTPException

from ..agent.graph import run_agent
from ..agent.provider import ProviderCredentialError, ProviderError
from ..database.models import AgentSession, Conversation, Message, PendingWrite, ToolExecution, now
from ..schemas import Attachment
from .connections import mark_rejected, tool_context
from .memory import context


def frame(event):
    return "data: " + json.dumps(event, ensure_ascii=False) + "\n\n"


async def until_stopped(source, stop):
    """Race the network/graph iterator against explicit stop, even between tokens."""
    waiter = asyncio.create_task(stop.wait())
    pending = None
    async with aclosing(source):
        try:
            while not stop.is_set():
                pending = asyncio.create_task(anext(source))
                done, _ = await asyncio.wait(
                    {pending, waiter}, return_when=asyncio.FIRST_COMPLETED
                )
                if waiter in done:
                    break
                try:
                    event = pending.result()
                except StopAsyncIteration:
                    break
                yield event
        finally:
            if pending and not pending.done():
                pending.cancel()
                with suppress(asyncio.CancelledError):
                    await pending
            waiter.cancel()
            with suppress(asyncio.CancelledError):
                await waiter


def prepare(state, repo, payload, prefs):
    db = repo.db
    if repo.user_id in state.active:
        raise HTTPException(409, "Another response is already running. Stop it first.")
    if payload.regenerate and not payload.conversation_id:
        raise HTTPException(422, "Choose a conversation to regenerate.")
    conv = repo.owned(Conversation, payload.conversation_id) if payload.conversation_id else None
    if not conv:
        if len(repo.conversations()) >= 100:
            raise HTTPException(409, "Workspace limit reached. Delete an old conversation first.")
        conv = Conversation(user_id=repo.user_id, title=payload.message[:76])
        db.add(conv)
        db.flush()
    old = repo.messages(conv.id)
    if payload.regenerate:
        if len(old) < 2 or old[-1].role != "assistant" or old[-2].role != "user":
            raise HTTPException(409, "Only the last response can be regenerated.")
        last = old.pop()
        db.delete(last)
        usr = old.pop()
        payload = payload.model_copy(
            update={
                "message": usr.content,
                "attachment": Attachment.model_validate(usr.attachment)
                if usr.attachment
                else None,
            }
        )
        for a in last.activity:
            if (
                a.get("type") == "approval"
                and (proposal := db.get(PendingWrite, a["id"]))
                and proposal.status == "pending"
            ):
                proposal.status = "declined"
    else:
        if len(old) >= 198:
            raise HTTPException(409, "Start a new conversation to continue.")
        db.add(
            Message(
                conversation_id=conv.id,
                role="user",
                content=payload.message,
                attachment=payload.attachment.model_dump() if payload.attachment else None,
            )
        )
        db.flush()
    assistant = Message(conversation_id=conv.id, role="assistant", content="", status="running")
    run = AgentSession(conversation_id=conv.id)
    db.add_all([assistant, run])
    conv.updated_at = now()
    db.commit()
    ctx = tool_context(state, repo, prefs)
    provider = (
        state.provider_factory(ctx.keys["groq"], prefs.model)
        if ctx.keys.get("groq") and prefs.provider != "local"
        else None
    )
    stop = asyncio.Event()
    state.active[repo.user_id] = (run.id, stop)

    async def stream():
        content = ""
        events = []
        status = "stopped"
        try:
            yield frame(
                {
                    "type": "start",
                    "conversation_id": conv.id,
                    "message_id": assistant.id,
                    "session_id": run.id,
                }
            )
            async with asyncio.timeout(70):
                async for e in until_stopped(
                    run_agent(payload, context(old, prefs.use_context), prefs, ctx, provider), stop
                ):
                    if e["type"] == "delta":
                        content += e["text"]
                    elif e["type"] == "tool":
                        db.add(
                            ToolExecution(session_id=run.id, name=e["name"], status=e["status"])
                        )
                        events.append(e)
                    elif e["type"] == "proposal":
                        p = PendingWrite(
                            user_id=repo.user_id,
                            conversation_id=conv.id,
                            filename=e["filename"],
                            content=e["content"],
                        )
                        db.add(p)
                        # A browser may approve immediately after receiving this event.
                        db.commit()
                        e = {
                            "type": "approval",
                            "id": p.id,
                            "filename": p.filename,
                            "content": p.content,
                            "status": "pending",
                        }
                        events.append(e)
                    elif e["type"] == "activity":
                        events.append(e)
                    yield frame(e)
            status = "stopped" if stop.is_set() else "complete"
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            status = "error"
            if isinstance(exc, ProviderCredentialError):
                mark_rejected(repo, "groq")
            message = (
                str(exc)
                if isinstance(exc, ProviderError)
                else "The agent could not finish this request. Check your connection and try again."
            )
            logging.getLogger("atlas").warning("Agent failure: %s", type(exc).__name__)
            content += ("\n\n" if content else "") + message
            yield frame({"type": "error", "text": message})
        finally:
            try:
                assistant.content = content
                assistant.status = status
                assistant.activity = events
                run.status = status
                conv.updated_at = now()
                db.commit()
            finally:
                state.active.pop(repo.user_id, None)
        yield frame({"type": "done", "status": status})

    return stream()

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from ...database.models import (
    Conversation,
    PendingWrite,
)
from ...schemas import (
    ChatInput,
    Confirmation,
    Detail,
    Msg,
    StatusView,
    StopInput,
    Summary,
)
from ...services.approvals import resolve
from ...services.chat import prepare
from .dependencies import workspace

api = APIRouter(prefix="/api/v1")


@api.get("/conversations", response_model=list[Summary])
def list_conversations(r=Depends(workspace)):
    return r.conversations()


@api.get("/conversations/{cid}", response_model=Detail)
def get_conversation(cid: str, r=Depends(workspace)):
    c = r.owned(Conversation, cid)
    rows = [Msg.model_validate(m) for m in r.messages(c.id)]
    for msg in rows:
        for a in msg.activity:
            if a.get("type") == "approval" and (p := r.db.get(PendingWrite, a["id"])):
                a["status"] = p.status
    return {**Summary.model_validate(c).model_dump(), "messages": rows}


@api.delete("/conversations/{cid}", status_code=204)
def delete_conversation(cid: str, req: Request, r=Depends(workspace)):
    if r.user_id in req.app.state.active:
        raise HTTPException(409, "Stop the current response before deleting a conversation.")
    r.db.delete(r.owned(Conversation, cid))
    r.db.commit()


@api.post("/chat")
async def chat(payload: ChatInput, req: Request, r=Depends(workspace)):
    stream = prepare(req.app.state, r, payload, r.preferences())
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


@api.post("/agent/stop", response_model=StatusView)
async def stop_generation(payload: StopInput, req: Request, r=Depends(workspace)):
    active = req.app.state.active.get(r.user_id)
    if active and active[0] == payload.session_id:
        active[1].set()
        return {"status": "stopping"}
    return {"status": "idle"}


@api.post("/actions/{aid}", response_model=StatusView)
def confirm(aid: str, payload: Confirmation, req: Request, r=Depends(workspace)):
    return resolve(aid, payload, req.app.state.settings.atlas_data_dir, r)

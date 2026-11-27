"""Workspace ownership checks live here; sessions never span independent requests."""

from hashlib import sha256
from secrets import token_urlsafe

from fastapi import HTTPException
from sqlalchemy import create_engine, event, func, select, update
from sqlalchemy.orm import sessionmaker

from ..schemas import Prefs
from .models import (
    AgentSession,
    Base,
    Conversation,
    Message,
    Preferences,
    ToolExecution,
    User,
    Workflow,
    WorkflowRun,
)


class Database:
    def __init__(self, url: str):
        self.engine = create_engine(
            url,
            hide_parameters=True,
            connect_args={"check_same_thread": False, "timeout": 10}
            if url.startswith("sqlite")
            else {},
        )
        if url.startswith("sqlite"):

            @event.listens_for(self.engine, "connect")
            def setup(conn, _):
                conn.execute("PRAGMA foreign_keys=ON")
                conn.execute("PRAGMA journal_mode=WAL")

        self.session = sessionmaker(self.engine, expire_on_commit=False)
        Base.metadata.create_all(self.engine)
        with self.session.begin() as db:
            db.execute(
                update(AgentSession)
                .where(AgentSession.status == "running")
                .values(status="stopped")
            )
            db.execute(update(Message).where(Message.status == "running").values(status="stopped"))


class Repository:
    def __init__(self, db, user_id):
        self.db, self.user_id = db, user_id

    @staticmethod
    def identity(db, token):
        if not token or len(token) > 100:
            return None
        return db.scalar(
            select(User).where(User.session_digest == sha256(token.encode()).hexdigest())
        )

    @staticmethod
    def new_workspace(db):
        token = token_urlsafe(32)
        user = User(session_digest=sha256(token.encode()).hexdigest())
        db.add(user)
        db.flush()
        db.add(Preferences(user_id=user.id, data={}))
        db.commit()
        return user, token

    def preferences(self) -> Prefs:
        values = dict(self.db.get(Preferences, self.user_id).data)
        # Old clients saved the seeded name even when only changing the theme. Do not
        # claim it as an identity. Preserve other old names and all explicit new ones.
        legacy_name = values.pop("name", "")
        name = values.pop("display_name", "" if legacy_name == "Atha" else legacy_name)
        return Prefs(name=name, **values)

    def save_preferences(self, values: Prefs) -> None:
        row = self.db.get(Preferences, self.user_id)
        row.data = {**values.model_dump(exclude={"name"}), "display_name": values.name}
        self.db.commit()

    def owned(self, model, key):
        obj = self.db.get(model, key)
        if not obj or obj.user_id != self.user_id:
            raise HTTPException(404, "Not found in this workspace.")
        return obj

    def conversations(self):
        return self.db.scalars(
            select(Conversation)
            .where(Conversation.user_id == self.user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(100)
        ).all()

    def messages(self, cid, limit=200):
        self.owned(Conversation, cid)
        return list(
            reversed(
                self.db.scalars(
                    select(Message)
                    .where(Message.conversation_id == cid)
                    .order_by(Message.created_at.desc())
                    .limit(limit)
                ).all()
            )
        )

    def stats(self):
        own = select(Conversation.id).where(Conversation.user_id == self.user_id)
        sessions = select(AgentSession.id).where(AgentSession.conversation_id.in_(own))
        workflows = select(Workflow.id).where(Workflow.user_id == self.user_id)

        def n(model, condition):
            return self.db.scalar(select(func.count()).select_from(model).where(condition))

        return {
            "conversations": n(Conversation, Conversation.user_id == self.user_id),
            "messages": n(Message, Message.conversation_id.in_(own)),
            "tool_runs": n(ToolExecution, ToolExecution.session_id.in_(sessions)),
            "workflow_runs": n(WorkflowRun, WorkflowRun.workflow_id.in_(workflows)),
        }

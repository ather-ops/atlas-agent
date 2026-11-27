"""The only path that can materialize an agent-proposed file."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import update

from ..database.models import PendingWrite
from ..schemas import Confirmation
from ..tools.files import WorkspaceFiles


def resolve(aid: str, payload: Confirmation, directory, r):
    a = r.owned(PendingWrite, aid)
    if a.status != "pending":
        raise HTTPException(409, "This proposal has already been resolved.")
    if datetime.now(timezone.utc) - datetime.fromisoformat(a.created_at) > timedelta(minutes=10):
        raise HTTPException(410, "Proposal expired. Ask Atlas to prepare it again.")
    claim = r.db.execute(
        update(PendingWrite)
        .where(
            PendingWrite.id == aid,
            PendingWrite.user_id == r.user_id,
            PendingWrite.status == "pending",
        )
        .values(status="resolving")
    )
    if claim.rowcount != 1:
        r.db.rollback()
        raise HTTPException(409, "This proposal has already been resolved.")
    if payload.approve:
        try:
            WorkspaceFiles(directory / "files" / r.user_id).create(a.filename, a.content)
        except (ValueError, OSError) as e:
            r.db.rollback()
            raise HTTPException(
                409, str(e) if isinstance(e, ValueError) else "File could not be created."
            ) from None
    a.status = "approved" if payload.approve else "declined"
    r.db.commit()
    return {"status": a.status}

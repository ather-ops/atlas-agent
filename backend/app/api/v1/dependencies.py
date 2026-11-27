from fastapi import Depends, HTTPException, Request

from ...database.repository import Repository


def session(request: Request):
    with request.app.state.database.session() as db:
        yield db


def workspace(request: Request, db=Depends(session)):
    user = Repository.identity(db, request.cookies.get("atlas_workspace"))
    if not user:
        raise HTTPException(401, "Open this workspace first. Session cookies must be enabled.")
    return Repository(db, user.id)

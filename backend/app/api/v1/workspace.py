from fastapi import APIRouter, Depends, HTTPException, Request, Response

from ...core.config import VERSION
from ...database.models import Integration
from ...database.repository import Repository
from ...schemas import (
    AgentStatus,
    IntegrationView,
    KeyInput,
    Prefs,
    StatusView,
    Summary,
    ToolView,
    WorkspaceView,
)
from ...services.connections import SERVICES, connections, retrieve, verify_and_save
from ...tools.registry import TOOLS
from .dependencies import session, workspace

api = APIRouter(prefix="/api/v1")


def status(state, r, p):
    configured = bool(retrieve(state, r, "groq"))
    mode = "groq" if configured and p.provider == "auto" else "local"
    return AgentStatus(
        ready=True,
        mode=mode,
        model=p.model if mode == "groq" else "Local tools",
        groq_configured=configured,
    )


@api.get("/workspace", response_model=WorkspaceView)
def bootstrap(req: Request, res: Response, db=Depends(session)):
    user = Repository.identity(db, req.cookies.get("atlas_workspace"))
    if not user:
        user, token = Repository.new_workspace(db)
        secure = (
            req.url.scheme == "https"
            or req.headers.get("x-forwarded-proto") == "https"
            or (req.url.hostname or "").endswith(".e2b.app")
        )
        res.set_cookie(
            "atlas_workspace",
            token,
            max_age=60 * 60 * 24 * 90,
            httponly=True,
            secure=secure,
            samesite="none" if secure else "lax",
            path="/",
        )
        if secure:
            res.headers["set-cookie"] += "; Partitioned"
    res.headers["Cache-Control"] = "no-store"
    r = Repository(db, user.id)
    p = r.preferences()
    return {
        "preferences": p,
        "status": status(req.app.state, r, p),
        "conversations": [Summary.model_validate(x) for x in r.conversations()],
        "stats": r.stats(),
        "integrations": connections(req.app.state, r),
        "version": VERSION,
    }


@api.get("/agent/status", response_model=AgentStatus)
def get_status(req: Request, r=Depends(workspace)):
    return status(req.app.state, r, r.preferences())


@api.get("/settings", response_model=Prefs)
def settings(r=Depends(workspace)):
    return r.preferences()


@api.put("/settings", response_model=Prefs)
def save_settings(p: Prefs, r=Depends(workspace)):
    r.save_preferences(p)
    return p


@api.get("/tools", response_model=list[ToolView])
def tools(req: Request, r=Depends(workspace)):
    p = r.preferences()
    return [
        {
            **t.specification()["function"],
            "available": not t.service
            or (p.allow_network and bool(retrieve(req.app.state, r, t.service))),
            "requires_confirmation": t.name == "write_file",
        }
        for t in TOOLS.values()
    ]


@api.get("/integrations", response_model=list[IntegrationView])
def get_connections(req: Request, r=Depends(workspace)):
    return connections(req.app.state, r)


@api.put("/integrations/{name}", response_model=StatusView)
async def connect(name: str, payload: KeyInput, req: Request, r=Depends(workspace)):
    await verify_and_save(req.app.state, r, name, payload.key)
    return {"status": "connected"}


@api.delete("/integrations/{name}", status_code=204)
def disconnect(name: str, r=Depends(workspace)):
    if name not in SERVICES:
        raise HTTPException(404, "Not a configurable service.")
    obj = r.db.get(Integration, (r.user_id, name))
    if not obj:
        raise HTTPException(
            409, "No saved key to remove. Environment keys are managed on the server."
        )
    r.db.delete(obj)
    r.db.commit()

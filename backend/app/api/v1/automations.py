from fastapi import APIRouter, Depends, Request

from ...schemas import WorkflowInput, WorkflowState, WorkflowView
from ...services import workflows as service
from ...services.connections import tool_context
from .dependencies import workspace

api = APIRouter(prefix="/api/v1")


@api.get("/automations", response_model=list[WorkflowView])
def list_workflows(r=Depends(workspace)):
    return service.workflows(r)


@api.get("/automations/{wid}", response_model=WorkflowView)
def detail(wid: str, r=Depends(workspace)):
    return service.workflow(wid, r)


@api.post("/automations", response_model=WorkflowView, status_code=201)
def create(data: WorkflowInput, r=Depends(workspace)):
    return service.create_workflow(data, r)


@api.patch("/automations/{wid}", response_model=WorkflowView)
def update(wid: str, p: WorkflowState, r=Depends(workspace)):
    return service.change_workflow(wid, p, r)


@api.post("/automations/{wid}/run", response_model=WorkflowView)
async def run(wid: str, req: Request, r=Depends(workspace)):
    return await service.run_workflow(wid, tool_context(req.app.state, r, r.preferences()), r)

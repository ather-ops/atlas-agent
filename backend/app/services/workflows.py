"""Manual, read-only workflows. Descriptions never become executable code."""

from fastapi import HTTPException
from sqlalchemy import func, select

from ..database.models import Workflow, WorkflowRun
from ..schemas import WorkflowInput, WorkflowState
from ..tools.registry import execute


def workflow_view(r, w):
    runs = r.db.scalars(
        select(WorkflowRun)
        .where(WorkflowRun.workflow_id == w.id)
        .order_by(WorkflowRun.created_at.desc())
        .limit(20)
    ).all()
    return {
        "id": w.id,
        "name": w.name,
        "description": w.description,
        "tool": w.tool,
        "arguments": w.arguments,
        "status": w.status,
        "schedule": "Manual",
        "created_at": w.created_at,
        "runs": [
            {"id": v.id, "created_at": v.created_at, "status": v.status, "result": v.result}
            for v in runs
        ],
    }


def workflows(r):
    return [
        workflow_view(r, w)
        for w in r.db.scalars(
            select(Workflow)
            .where(Workflow.user_id == r.user_id)
            .order_by(Workflow.created_at.desc())
            .limit(50)
        )
    ]


def workflow(wid: str, r):
    return workflow_view(r, r.owned(Workflow, wid))


def create_workflow(data: WorkflowInput, r):
    if (
        r.db.scalar(
            select(func.count()).select_from(Workflow).where(Workflow.user_id == r.user_id)
        )
        >= 50
    ):
        raise HTTPException(409, "This workspace is limited to 50 workflows.")
    if data.tool == "calculator" and not data.expression:
        raise HTTPException(422, "Enter a numeric expression.")
    w = Workflow(
        user_id=r.user_id,
        name=data.name,
        description=data.description,
        tool=data.tool,
        arguments={"expression": data.expression} if data.tool == "calculator" else {},
    )
    r.db.add(w)
    r.db.commit()
    return workflow_view(r, w)


def change_workflow(wid: str, p: WorkflowState, r):
    w = r.owned(Workflow, wid)
    w.status = p.status
    r.db.commit()
    return workflow_view(r, w)


async def run_workflow(wid: str, ctx, r):
    w = r.owned(Workflow, wid)
    if w.status == "paused":
        raise HTTPException(409, "Resume this workflow before running it.")
    result = await execute(w.tool, w.arguments, ctx)
    r.db.add(
        WorkflowRun(
            workflow_id=w.id, status="complete" if result.ok else "failed", result=result.text
        )
    )
    w.status = "active" if result.ok else "failed"
    r.db.commit()
    return workflow_view(r, w)

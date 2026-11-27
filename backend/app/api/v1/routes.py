"""Versioned API composition. Business services are independent of routing."""

from fastapi import APIRouter

from .automations import api as automations
from .conversations import api as conversations
from .workspace import api as workspace

api = APIRouter()
for router in (workspace, conversations, automations):
    api.include_router(router)

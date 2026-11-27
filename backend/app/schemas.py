from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .core.config import MODELS


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Prefs(Input):
    name: str = Field("", max_length=40)
    theme: Literal["light", "dark", "system"] = "light"
    provider: Literal["auto", "local"] = "auto"
    model: Literal["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] = MODELS[0]
    style: Literal["balanced", "concise", "detailed"] = "balanced"
    use_context: bool = True
    allow_network: bool = True


class Attachment(Input):
    name: str = Field(min_length=1, max_length=90, pattern=r"^[\w -][\w .-]*\.(txt|md|csv)$")
    text: str = Field(min_length=1, max_length=16000)

    @field_validator("text")
    @classmethod
    def only_text(cls, v):
        if any(ord(c) < 32 and c not in "\r\n\t" for c in v):
            raise ValueError("Only plain text is supported.")
        return v


class ChatInput(Input):
    message: str = Field(min_length=1, max_length=6000)
    conversation_id: str | None = Field(None, max_length=36)
    attachment: Attachment | None = None
    regenerate: bool = False
    search: bool = False


class Summary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    created_at: str
    updated_at: str


class Msg(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    status: str
    attachment: dict | None
    activity: list[dict]
    created_at: str


class Detail(Summary):
    messages: list[Msg]


class KeyInput(Input):
    key: str = Field(min_length=8, max_length=512)


class WorkflowInput(Input):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    tool: Literal["datetime", "system_info", "calculator"] = "datetime"
    expression: str = Field("", max_length=140)


class WorkflowState(Input):
    status: Literal["active", "paused"]


class Confirmation(Input):
    approve: bool


class AgentStatus(BaseModel):
    ready: bool
    mode: Literal["local", "groq"]
    model: str
    groq_configured: bool


class Health(BaseModel):
    status: str
    version: str


class StopInput(Input):
    session_id: str = Field(min_length=36, max_length=36)


class IntegrationView(BaseModel):
    id: str
    name: str
    description: str
    permission: str
    status: Literal["connected", "configured", "available", "coming_soon", "error"]
    managed: bool


class Counts(BaseModel):
    conversations: int
    messages: int
    tool_runs: int
    workflow_runs: int


class WorkspaceView(BaseModel):
    preferences: Prefs
    status: AgentStatus
    conversations: list[Summary]
    stats: Counts
    integrations: list[IntegrationView]
    version: str


class ToolView(BaseModel):
    name: str
    description: str
    parameters: dict
    available: bool
    requires_confirmation: bool


class RunView(BaseModel):
    id: str
    created_at: str
    status: Literal["complete", "failed"]
    result: str


class WorkflowView(BaseModel):
    id: str
    name: str
    description: str
    tool: str
    arguments: dict
    status: Literal["active", "paused", "failed"]
    schedule: Literal["Manual"]
    created_at: str
    runs: list[RunView]


class StatusView(BaseModel):
    status: str

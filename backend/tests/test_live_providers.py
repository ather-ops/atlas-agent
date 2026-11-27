"""Explicit opt-in live checks. Calls may consume provider credits. Never run in default CI."""

import os

import pytest

from backend.app.agent.provider import GroqProvider
from backend.app.core.config import MODELS, Settings
from backend.app.tools.files import WorkspaceFiles
from backend.app.tools.registry import ToolContext, execute

pytestmark = pytest.mark.skipif(
    os.getenv("ATLAS_RUN_LIVE") != "1",
    reason="Paid/network provider checks require explicit opt-in.",
)


async def test_live_groq():
    cfg = Settings()
    if not cfg.groq_api_key:
        pytest.skip("Groq key not configured.")
    answer = await GroqProvider(cfg.groq_api_key.get_secret_value(), MODELS[0]).complete(
        [{"role": "user", "content": "Reply with the single word Atlas."}], [], lambda e: None
    )
    assert answer.content.strip() and not answer.calls


@pytest.mark.parametrize(
    "service,tool,args",
    [
        ("tavily", "web_search", {"query": "Python documentation"}),
        ("openweather", "weather", {"city": "Srinagar"}),
    ],
)
async def test_live_tool(service, tool, args, tmp_path):
    key = getattr(Settings(), service + "_api_key")
    if not key:
        pytest.skip("Provider key not configured.")
    res = await execute(
        tool, args, ToolContext(WorkspaceFiles(tmp_path), {service: key.get_secret_value()})
    )
    assert res.ok and res.text

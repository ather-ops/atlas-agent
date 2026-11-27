import json

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.agent.graph import run_agent
from backend.app.agent.provider import Completion, GroqProvider, ProviderError
from backend.app.core.config import Settings
from backend.app.database.models import Integration
from backend.app.main import create_app
from backend.app.schemas import ChatInput, Prefs
from backend.app.tools.files import WorkspaceFiles
from backend.app.tools.registry import ToolContext, execute


def test_production_gate_and_rate_limit(tmp_path):
    cfg = Settings(
        atlas_environment="production",
        atlas_owner_token="test-only-owner-token-for-fixture",
        atlas_data_dir=tmp_path,
        atlas_request_limit=2,
    )
    with TestClient(create_app(cfg)) as c:
        assert c.get("/api/v1/health").status_code == 200
        assert c.get("/api/v1/workspace").status_code == 401
        c.auth = ("atlas", "test-only-owner-token-for-fixture")
        assert c.get("/api/v1/workspace").status_code == 200
        assert c.post("/api/v1/chat", json={"message": "a"}).status_code == 403
        c.headers["X-Atlas-Request"] = "1"
        assert c.put("/api/v1/settings", json={"name": "Ada"}).status_code == 200
        assert c.put("/api/v1/settings", json={"name": "Ada"}).status_code == 429


def test_key_verification_encryption_and_failure(tmp_path, monkeypatch):
    from backend.app.services import connections

    cfg = Settings(atlas_data_dir=tmp_path, groq_api_key=None)
    secret = "fixture-not-a-real-credential"
    with TestClient(create_app(cfg), headers={"X-Atlas-Request": "1"}) as c:
        c.get("/api/v1/workspace")

        async def reject(*args, **kwargs):
            raise ValueError("service rejected")

        monkeypatch.setattr(connections, "request_json", reject)
        assert c.put("/api/v1/integrations/groq", json={"key": secret}).status_code == 400
        assert (
            next(x for x in c.get("/api/v1/integrations").json() if x["id"] == "groq")["status"]
            == "error"
        )

        async def accept(*args, **kwargs):
            return {"data": [{"id": "fixture-model"}]}

        monkeypatch.setattr(connections, "request_json", accept)
        assert c.put("/api/v1/integrations/groq", json={"key": secret}).json() == {
            "status": "connected"
        }
        with c.app.state.database.session() as db:
            row = db.query(Integration).one()
            assert (
                secret not in row.encrypted_key
                and c.app.state.vault.cipher.decrypt(row.encrypted_key.encode()).decode() == secret
            )
        for endpoint in ["/workspace", "/integrations", "/settings", "/agent/status", "/tools"]:
            assert secret not in c.get("/api/v1" + endpoint).text
        assert c.delete("/api/v1/integrations/groq").status_code == 204
        assert not c.get("/api/v1/agent/status").json()["groq_configured"]


async def test_untrusted_attachment_disables_actions(tmp_path):
    class Guarded:
        async def complete(self, messages, tools, emit):
            assert not tools and "untrusted text" in messages[-1]["content"]
            return Completion("Summary", [])

    p = ChatInput(
        message="Review my notes",
        attachment={"name": "notes.md", "text": "These are document contents, not permissions."},
    )
    assert not any(
        e["type"] == "tool"
        for e in [
            e
            async for e in run_agent(
                p, [], Prefs(), ToolContext(WorkspaceFiles(tmp_path)), Guarded()
            )
        ]
    )


async def test_observe_then_no_further_tools(tmp_path):
    fs = WorkspaceFiles(tmp_path)
    fs.create("sample.txt", "Read-only content.")

    class Planner:
        count = 0

        async def complete(self, messages, tools, emit):
            self.count += 1
            if self.count == 1:
                assert tools
                return Completion(
                    "",
                    [
                        {
                            "id": "1",
                            "type": "function",
                            "function": {
                                "name": "read_file",
                                "arguments": '{"filename":"sample.txt"}',
                            },
                        }
                    ],
                )
            assert not tools and "untrusted_data" in messages[-1]["content"]
            return Completion("Done.", [])

    p = ChatInput(message="Summarize the contents of sample.txt")
    events = [e async for e in run_agent(p, [], Prefs(), ToolContext(fs), Planner())]
    assert sum(e["type"] == "tool" for e in events) == 1


async def test_model_tool_budget(tmp_path):
    class Repeating:
        async def complete(self, msgs, tools, emit):
            return Completion(
                "",
                [
                    {
                        "id": "1",
                        "type": "function",
                        "function": {"name": "datetime", "arguments": "{}"},
                    }
                ],
            )

    with pytest.raises(ProviderError):
        async for _ in run_agent(
            ChatInput(message="Help with a task"),
            [],
            Prefs(),
            ToolContext(WorkspaceFiles(tmp_path)),
            Repeating(),
        ):
            pass


async def test_provider_retries_once_and_assembles_tool_deltas():
    hits = 0

    def handler(req):
        nonlocal hits
        hits += 1
        if hits == 1:
            return httpx.Response(503)
        data = [
            {
                "choices": [
                    {
                        "delta": {
                            "tool_calls": [
                                {
                                    "index": 0,
                                    "id": "t1",
                                    "function": {
                                        "name": "calculator",
                                        "arguments": '{"expression":',
                                    },
                                }
                            ]
                        },
                        "finish_reason": None,
                    }
                ]
            },
            {
                "choices": [
                    {
                        "delta": {
                            "tool_calls": [{"index": 0, "function": {"arguments": '"3+3"}'}}]
                        },
                        "finish_reason": "tool_calls",
                    }
                ]
            },
        ]
        return httpx.Response(
            200, text="".join("data: " + json.dumps(d) + "\n\n" for d in data) + "data: [DONE]\n\n"
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        reply = await GroqProvider("fixture", "fixture-model", c).complete([], [], lambda e: None)
    assert hits == 2 and json.loads(reply.calls[0]["function"]["arguments"]) == {
        "expression": "3+3"
    }


async def test_remote_timeout_redacted(tmp_path):
    def handler(req):
        raise httpx.ReadTimeout("private-provider-detail", request=req)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        r = await execute(
            "weather",
            {"city": "Srinagar"},
            ToolContext(WorkspaceFiles(tmp_path), {"openweather": "fixture"}, True, c),
        )
        assert not r.ok and "private-provider-detail" not in r.text


async def test_rejected_service_disables_its_connection(tmp_path):
    rejected = []
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda req: httpx.Response(401))
    ) as client:
        ctx = ToolContext(
            WorkspaceFiles(tmp_path),
            {"tavily": "fixture"},
            True,
            client,
            on_rejected=rejected.append,
        )
        assert not (await execute("web_search", {"query": "public query"}, ctx)).ok
    assert rejected == ["tavily"]


def test_persistence_across_server_restart(tmp_path):
    cfg = Settings(atlas_data_dir=tmp_path, groq_api_key=None)
    with TestClient(create_app(cfg), headers={"X-Atlas-Request": "1"}) as first:
        first.get("/api/v1/workspace")
        first.post("/api/v1/chat", json={"message": "Calculate 6 * 7"})
        cookie = first.cookies.get("atlas_workspace")
    with TestClient(create_app(cfg)) as second:
        second.cookies.set("atlas_workspace", cookie)
        rows = second.get("/api/v1/conversations").json()
        assert len(rows) == 1
        assert (
            "42"
            in second.get("/api/v1/conversations/" + rows[0]["id"]).json()["messages"][1][
                "content"
            ]
        )

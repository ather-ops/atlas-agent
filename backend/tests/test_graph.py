import json

import httpx

from backend.app.agent.graph import run_agent
from backend.app.agent.provider import Completion, GroqProvider
from backend.app.schemas import ChatInput, Prefs
from backend.app.tools.files import WorkspaceFiles
from backend.app.tools.registry import ToolContext


async def test_groq_stream_contract():
    def handler(req):
        d = json.loads(req.content)
        assert req.url.host == "api.groq.com" and d["stream"] and d["model"] == "fixture-model"
        return httpx.Response(
            200,
            text="data: "
            + json.dumps(
                {"choices": [{"delta": {"content": "Test response"}, "finish_reason": "stop"}]}
            )
            + "\n\ndata: [DONE]\n\n",
        )

    events = []
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        x = await GroqProvider("fixture", "fixture-model", c).complete([], [], events.append)
        assert x.content == "Test response" and events[0]["type"] == "delta"


async def test_multistep(tmp_path):
    class Fake:
        turns = 0

        async def complete(self, msgs, tools, emit):
            self.turns += 1
            if self.turns < 3:
                return Completion(
                    "",
                    [
                        {
                            "id": str(self.turns),
                            "type": "function",
                            "function": {
                                "name": "calculator",
                                "arguments": json.dumps({"expression": "3+4"}),
                            },
                        }
                    ],
                )
            assert msgs[-1]["role"] == "tool" and "7" in msgs[-1]["content"]
            emit({"type": "delta", "text": "Verified."})
            return Completion("Verified.", [])

    output = [
        e
        async for e in run_agent(
            ChatInput(message="Help with a number"),
            [],
            Prefs(),
            ToolContext(WorkspaceFiles(tmp_path)),
            Fake(),
        )
    ]
    assert sum(e["type"] == "tool" for e in output) == 2


async def test_groq_wire_to_graph_to_persisted_turn(tmp_path):
    """Only the upstream wire is simulated: real adapter, graph, tools, API, database."""
    from fastapi.testclient import TestClient

    from backend.app.core.config import Settings
    from backend.app.main import create_app

    requests = []

    def upstream(req):
        body = json.loads(req.content)
        requests.append(body)
        assert req.headers["Authorization"] == "Bearer groq-fixture"
        if len(requests) == 1:
            assert any(t["function"]["name"] == "calculator" for t in body["tools"])
            chunks = [
                (
                    {
                        "tool_calls": [
                            {
                                "index": 0,
                                "id": "call_1",
                                "function": {
                                    "name": "calculator",
                                    "arguments": '{"expression":"4*4"}',
                                },
                            }
                        ]
                    },
                    "tool_calls",
                )
            ]
        else:
            result = body["messages"][-1]
            assert (
                result["role"] == "tool"
                and result["tool_call_id"] == "call_1"
                and "16" in result["content"]
            )
            chunks = [({"content": "The total is "}, None), ({"content": "**16**."}, "stop")]
        return httpx.Response(
            200,
            text="".join(
                "data: "
                + json.dumps({"choices": [{"delta": delta, "finish_reason": done}]})
                + "\n\n"
                for delta, done in chunks
            )
            + "data: [DONE]\n\n",
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as transport:
        app = create_app(
            Settings(atlas_data_dir=tmp_path, groq_api_key="groq-fixture"),
            provider_factory=lambda key, model: GroqProvider(key, model, transport),
        )
        with TestClient(app, headers={"X-Atlas-Request": "1"}) as browser:
            browser.get("/api/v1/workspace")
            res = browser.post(
                "/api/v1/chat", json={"message": "How many items are in four groups of four?"}
            )
            frames = [
                json.loads(line[6:]) for line in res.text.splitlines() if line.startswith("data: ")
            ]
            assert frames[-1]["status"] == "complete" and len(requests) == 2
            assert sum(f["type"] == "delta" for f in frames) == 2 and any(
                f.get("name") == "calculator" for f in frames
            )
            saved = browser.get("/api/v1/conversations/" + frames[0]["conversation_id"]).json()
            assert saved["messages"][-1]["content"] == "The total is **16**."

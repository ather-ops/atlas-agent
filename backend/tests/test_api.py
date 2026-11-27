import json

import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import Settings
from backend.app.database.models import Preferences
from backend.app.main import create_app


@pytest.fixture
def client(tmp_path):
    cfg = Settings(
        atlas_data_dir=tmp_path,
        atlas_environment="test",
        groq_api_key=None,
        tavily_api_key=None,
        openweather_api_key=None,
        _env_file=None,
    )
    with TestClient(create_app(cfg), headers={"X-Atlas-Request": "1"}) as c:
        assert c.get("/api/v1/workspace").json()["stats"]["conversations"] == 0
        yield c


def send(c, message, **extras):
    r = c.post("/api/v1/chat", json={"message": message, **extras})
    assert r.status_code == 200
    return [json.loads(line[6:]) for line in r.text.splitlines() if line.startswith("data: ")]


def test_persist_regenerate_and_delete(client):
    a = send(client, "calculate 18*4")
    cid = a[0]["conversation_id"]
    assert "72" in "".join(e.get("text", "") for e in a)
    assert a[-1]["status"] == "complete"
    assert any(e["type"] == "tool" for e in a)
    send(client, "regenerate", conversation_id=cid, regenerate=True)
    assert len(client.get("/api/v1/conversations/" + cid).json()["messages"]) == 2
    assert client.get("/api/v1/workspace").json()["stats"]["tool_runs"] == 2
    assert client.delete("/api/v1/conversations/" + cid).status_code == 204
    assert client.get("/api/v1/conversations").json() == []


def test_display_name_is_optional_and_scoped(client):
    workspace = "/api/v1/workspace"
    settings = "/api/v1/settings"
    assert client.get(workspace).json()["preferences"]["name"] == ""
    assert client.put(settings, json={"theme": "dark"}).json()["name"] == ""
    assert client.put(settings, json={"name": "  نور علي  "}).json()["name"] == "نور علي"
    assert client.get(workspace).json()["preferences"]["name"] == "نور علي"
    assert client.put(settings, json={"name": "x" * 41}).status_code == 422
    client.cookies.clear()
    assert client.get(workspace).json()["preferences"]["name"] == ""


@pytest.mark.parametrize(("old_name", "expected"), [("Atha", ""), ("Mira Das", "Mira Das")])
def test_legacy_profile_names_without_losing_preferences(client, old_name, expected):
    # v2 preview settings wrote a name on every save, even a theme-only change.
    with client.app.state.database.session.begin() as db:
        db.query(Preferences).one().data = {"name": old_name, "theme": "dark"}
    prefs = client.get("/api/v1/settings").json()
    assert (prefs["name"], prefs["theme"]) == (expected, "dark")
    # The old sample is not a forbidden name. A person's deliberate choice persists.
    client.put("/api/v1/settings", json={**prefs, "name": "Atha"}).raise_for_status()
    assert client.get("/api/v1/workspace").json()["preferences"]["name"] == "Atha"


def test_owned_files(client):
    a = send(client, "Write note.txt: Hello Atlas")
    p = next(e for e in a if e["type"] == "approval")
    assert "not found" in "".join(e.get("text", "") for e in send(client, "read note.txt"))
    assert (
        client.post("/api/v1/actions/" + p["id"], json={"approve": True}).json()["status"]
        == "approved"
    )
    assert client.post("/api/v1/actions/" + p["id"], json={"approve": True}).status_code == 409
    assert "Hello Atlas" in "".join(e.get("text", "") for e in send(client, "read note.txt"))


def test_isolation(client):
    a = send(client, "what time is it?")
    cid = a[0]["conversation_id"]
    client.cookies.clear()
    assert client.get("/api/v1/conversations").status_code == 401
    client.get("/api/v1/workspace")
    assert client.get("/api/v1/conversations/" + cid).status_code == 404


def test_validation_and_origin(client):
    assert client.post("/api/v1/chat", json={"message": " "}).status_code == 422
    assert client.post("/api/v1/chat", json={"message": "a" * 100000}).status_code == 413
    assert (
        client.post(
            "/api/v1/chat",
            json={"message": "hello"},
            headers={"Origin": "https://unrelated.example"},
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/v1/chat",
            json={"message": "read", "attachment": {"name": "binary.exe", "text": "a"}},
        ).status_code
        == 422
    )


def test_workflow_and_settings(client):
    w = client.post(
        "/api/v1/automations",
        json={
            "name": "Math check",
            "description": "Calculate a fixed expression.",
            "tool": "calculator",
            "expression": "3+5",
        },
    ).json()
    p = "/api/v1/automations/" + w["id"]
    assert "8" in client.post(p + "/run").json()["runs"][0]["result"]
    assert client.patch(p, json={"status": "paused"}).json()["status"] == "paused"
    assert client.post(p + "/run").status_code == 409
    assert (
        client.put("/api/v1/settings", json={"name": "Ada", "theme": "dark"}).json()["name"]
        == "Ada"
    )
    assert client.get("/api/v1/settings").json()["theme"] == "dark"
    assert (
        client.put("/api/v1/integrations/gmail", json={"key": "test-fixture"}).status_code == 409
    )
    assert client.get("/api/v1/agent/status").json()["mode"] == "local"


def test_stop_cancels_waiting_graph_and_keeps_partial_text(client, monkeypatch):
    import asyncio
    import threading
    from concurrent.futures import ThreadPoolExecutor

    from backend.app.services import chat

    entered = threading.Event()

    async def slow(*args):
        yield {"type": "delta", "text": "First token."}
        entered.set()
        await asyncio.sleep(8)
        yield {"type": "delta", "text": "Should not arrive."}

    monkeypatch.setattr(chat, "run_agent", slow)
    with ThreadPoolExecutor(1) as pool:
        task = pool.submit(send, client, "test cancellation")
        assert entered.wait(3)
        run_id = next(iter(client.app.state.active.values()))[0]
        assert (
            client.post("/api/v1/agent/stop", json={"session_id": run_id}).json()["status"]
            == "stopping"
        )
        events = task.result(timeout=3)
    assert events[-1]["status"] == "stopped"
    m = client.get("/api/v1/conversations/" + events[0]["conversation_id"]).json()["messages"][-1]
    assert (
        m["content"] == "First token." and m["status"] == "stopped" and not client.app.state.active
    )

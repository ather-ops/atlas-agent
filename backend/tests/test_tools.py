import json

import httpx
import pytest

from backend.app.tools.files import WorkspaceFiles
from backend.app.tools.registry import ToolContext, execute


@pytest.fixture
def ctx(tmp_path):
    return ToolContext(WorkspaceFiles(tmp_path / "files"))


@pytest.mark.parametrize(
    "name,args,expected",
    [
        ("datetime", {}, "UTC"),
        ("system_info", {}, "LangGraph"),
        ("calculator", {"expression": "(8 + 4) * 3"}, "36"),
        ("python", {"code": "n = 6 * 7\nprint(n)"}, "42"),
    ],
)
async def test_local(name, args, expected, ctx):
    r = await execute(name, args, ctx)
    assert r.ok and expected in r.text


@pytest.mark.parametrize(
    "name,args",
    [
        ("python", {"code": "import math"}),
        ("calculator", {"expression": "2**200"}),
        ("calculator", {"expression": "1/0"}),
        ("calculator", {"expression": "hello()"}),
        ("read_file", {"filename": "../outside.txt"}),
        ("datetime", {"key": "unexpected"}),
    ],
)
async def test_restrictions(name, args, ctx):
    assert not (await execute(name, args, ctx)).ok


async def test_write_is_proposal(ctx):
    a = {"filename": "note.txt", "content": "example text"}
    r = await execute("write_file", a, ctx)
    assert r.proposal == a and not (ctx.files.root / "note.txt").exists()
    ctx.files.create("note.txt", "example text")
    assert (await execute("read_file", {"filename": "note.txt"}, ctx)).text == "example text"
    with pytest.raises(ValueError):
        ctx.files.create("note.txt", "new")


async def test_links_rejected(ctx, tmp_path):
    p = ctx.files.target("link.txt")
    target = tmp_path / "private"
    target.write_text("private")
    p.symlink_to(target)
    assert not (await execute("read_file", {"filename": "link.txt"}, ctx)).ok


@pytest.mark.parametrize(
    "name,args,service,body,expected",
    [
        (
            "weather",
            {"city": "Srinagar"},
            "openweather",
            {
                "name": "Srinagar",
                "main": {"temp": 8, "humidity": 60},
                "weather": [{"description": "clear sky"}],
                "wind": {"speed": 2},
            },
            "8 °C",
        ),
        (
            "web_search",
            {"query": "astronomy"},
            "tavily",
            {
                "results": [
                    {"title": "Stars", "url": "https://example.org", "content": "Test fixture"}
                ]
            },
            "https://example.org",
        ),
    ],
)
async def test_external_contracts(name, args, service, body, expected, ctx):
    assert not (await execute(name, args, ctx)).ok

    def handler(req):
        assert req.url.scheme == "https"
        if name == "weather":
            assert req.method == "GET" and req.url.host == "api.openweathermap.org"
            assert req.url.path == "/data/2.5/weather" and dict(req.url.params) == {
                "q": "Srinagar",
                "appid": "fixture",
                "units": "metric",
            }
        else:
            assert (
                req.method == "POST"
                and req.url.host == "api.tavily.com"
                and req.url.path == "/search"
            )
            assert req.headers["Authorization"] == "Bearer fixture"
            assert json.loads(req.content) == {
                "query": "astronomy",
                "max_results": 4,
                "search_depth": "basic",
                "include_raw_content": False,
            }
        return httpx.Response(200, json=body)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        ctx.client = c
        ctx.keys = {service: "fixture"}
        r = await execute(name, args, ctx)
        assert r.ok and expected in r.text
        ctx.network = False
        assert not (await execute(name, args, ctx)).ok

"""Schemas, permissions, time limits and structured results for every capability."""

import asyncio
import sys
import tempfile
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import httpx
from pydantic import Field, ValidationError

from ..core.config import VERSION
from ..integrations.adapters import ServiceCredentialError, ServiceError, search, weather
from ..schemas import Input
from .arithmetic import calculate
from .files import WorkspaceFiles


class Empty(Input):
    pass


class Expression(Input):
    expression: str = Field(min_length=1, max_length=160)


class City(Input):
    city: str = Field(min_length=1, max_length=80)


class Query(Input):
    query: str = Field(min_length=1, max_length=320)


class Filename(Input):
    filename: str = Field(min_length=5, max_length=80)


class Write(Filename):
    content: str = Field(min_length=1, max_length=8000)


class Code(Input):
    code: str = Field(min_length=1, max_length=2000)


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    schema: type[Input]
    service: str | None = None

    def specification(self):
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.schema.model_json_schema(),
            },
        }


TOOLS = {
    t.name: t
    for t in [
        Tool("datetime", "Read the current date and time in UTC.", Empty),
        Tool(
            "system_info", "Describe the Atlas application, version and storage boundary.", Empty
        ),
        Tool("weather", "Look up current weather for one city in Celsius.", City, "openweather"),
        Tool("calculator", "Calculate a bounded arithmetic expression.", Expression),
        Tool("read_file", "Read a named text file in this private workspace.", Filename),
        Tool(
            "write_file",
            "Propose creating a new text file. Requires separate human approval.",
            Write,
        ),
        Tool("web_search", "Find current sources online using Tavily.", Query, "tavily"),
        Tool(
            "python",
            "Interpret restricted Python: numeric assignments and print. No imports, I/O or loops.",
            Code,
        ),
    ]
}


@dataclass
class ToolContext:
    files: WorkspaceFiles
    keys: dict = field(default_factory=dict)
    network: bool = True
    client: httpx.AsyncClient | None = None
    on_rejected: Callable[[str], None] | None = None


@dataclass
class Result:
    ok: bool
    text: str
    untrusted: bool = False
    proposal: dict | None = None


async def restricted_code(code):
    with tempfile.TemporaryDirectory() as tmp:
        p = await asyncio.create_subprocess_exec(
            sys.executable,
            "-I",
            "-S",
            str(Path(__file__).with_name("code_worker.py").resolve()),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
            cwd=tmp,
            env={},
        )
        try:
            output, _ = await asyncio.wait_for(p.communicate(code.encode()), 3)
        finally:
            if p.returncode is None:
                p.kill()
                await p.wait()
        if p.returncode:
            raise ValueError(
                "This sandbox accepts numeric assignments and print only. Imports, loops and general Python are unavailable."
            )
        return output.decode().strip()


async def execute(name, arguments, ctx: ToolContext):
    spec = TOOLS.get(name)
    if not spec:
        return Result(False, "Unknown tool.")
    try:
        a = spec.schema.model_validate(arguments).model_dump()
        async with asyncio.timeout(15):
            if spec.service:
                if not ctx.network:
                    return Result(False, "External tools are disabled in Settings.")
                key = ctx.keys.get(spec.service)
                if not key:
                    return Result(
                        False,
                        f"Configure {spec.service.title()} in Integrations to use this tool.",
                    )

                async def fetch(c):
                    return await (
                        search(c, key, a["query"])
                        if name == "web_search"
                        else weather(c, key, a["city"])
                    )

                if ctx.client:
                    text = await fetch(ctx.client)
                else:
                    async with httpx.AsyncClient() as c:
                        text = await fetch(c)
                return Result(True, text, True)
            if name == "datetime":
                return Result(
                    True, datetime.now(timezone.utc).strftime("%A, %B %d, %Y · %H:%M UTC")
                )
            if name == "system_info":
                return Result(
                    True,
                    f"Atlas **{VERSION}** is running in a personal workspace.\n\n- **Orchestration:** LangGraph\n- **Tools:** 8 registered capabilities\n- **Files:** private, text-only workspace\n- **Python:** isolated numeric interpreter\n\nNo host or credential information is exposed.",
                )
            if name == "calculator":
                return Result(True, f"{a['expression']} = **{calculate(a['expression']):g}**")
            if name == "read_file":
                return Result(True, ctx.files.read(a["filename"]), True)
            if name == "write_file":
                ctx.files.target(a["filename"])
                return Result(
                    True,
                    f"Review the proposed contents of **{a['filename']}** below. Nothing is written until you approve.",
                    proposal=a,
                )
            return Result(True, await restricted_code(a["code"]))
    except ValidationError:
        return Result(False, "Invalid tool arguments. Check the inputs and size limits.")
    except (SyntaxError, ArithmeticError, RecursionError):
        return Result(False, "The expression is invalid or outside the allowed limits.")
    except (httpx.HTTPError, TimeoutError):
        return Result(False, "The service did not respond in time. Please try again.")
    except ServiceCredentialError as e:
        if ctx.on_rejected and spec.service:
            ctx.on_rejected(spec.service)
        return Result(False, str(e))
    except ServiceError as e:
        return Result(False, str(e))
    except (OSError, UnicodeError, KeyError, IndexError, TypeError, AttributeError):
        return Result(False, "The tool could not read a valid result.")
    except ValueError as e:
        return Result(
            False,
            str(e)[:180] if not spec.service else "The service returned an invalid response.",
        )

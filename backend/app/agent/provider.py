"""Replaceable chat-completion interface, with Groq's native streamed tool calls."""

import asyncio
import json
from dataclasses import dataclass
from typing import Protocol

import httpx


class ProviderError(Exception):
    pass


class ProviderCredentialError(ProviderError):
    pass


@dataclass
class Completion:
    content: str
    calls: list


class Provider(Protocol):
    async def complete(self, messages, tools, emit) -> Completion: ...


class GroqProvider:
    def __init__(self, key, model, client=None):
        self.key, self.model, self.client = key, model, client

    async def complete(self, messages, tools, emit):
        if self.client:
            return await self._stream(self.client, messages, tools, emit)
        async with httpx.AsyncClient(timeout=httpx.Timeout(28, connect=5)) as c:
            return await self._stream(c, messages, tools, emit)

    async def _stream(self, c, messages, tools, emit):
        body = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "temperature": 0.3,
            "max_tokens": 1800,
        }
        if tools:
            body.update(tools=tools, tool_choice="auto", parallel_tool_calls=False)
        for attempt in range(2):
            async with c.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.key}"},
                json=body,
            ) as r:
                if r.status_code in (429, 502, 503) and attempt == 0:
                    await asyncio.sleep(0.35)
                    continue
                if r.status_code in (401, 403):
                    raise ProviderCredentialError(
                        "Groq rejected its credentials. Configure a valid API key in Settings."
                    )
                if r.status_code >= 400:
                    raise ProviderError(
                        "Groq could not complete this request. Check the model, API key and quota in Settings."
                    )
                text = ""
                calls = {}
                finished = False
                async for line in r.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        break
                    obj = json.loads(payload)
                    if obj.get("error"):
                        raise ProviderError("Groq interrupted the response. Please retry.")
                    choices = obj.get("choices", [])
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {})
                    if s := delta.get("content"):
                        text += s
                        if len(text) > 18000:
                            raise ProviderError("Response exceeded the output limit.")
                        emit({"type": "delta", "text": s})
                    for chunk in delta.get("tool_calls") or []:
                        i = chunk["index"]
                        if not isinstance(i, int) or i not in range(3):
                            raise ProviderError("Tool-call budget exceeded.")
                        item = calls.setdefault(
                            i,
                            {
                                "id": "",
                                "type": "function",
                                "function": {"name": "", "arguments": ""},
                            },
                        )
                        item["id"] += chunk.get("id") or ""
                        for k in ("name", "arguments"):
                            item["function"][k] += (chunk.get("function") or {}).get(k) or ""
                        if len(item["function"]["arguments"]) > 12000:
                            raise ProviderError("Tool input exceeds the limit.")
                    if choices[0].get("finish_reason"):
                        finished = True
                if not finished or (not text and not calls):
                    raise ProviderError(
                        "Groq returned an incomplete response. You can regenerate it."
                    )
                return Completion(text, list(calls.values()))

"""Single-worker owner gate, bounded mutation rate and request-body limits."""

import base64
import secrets
import time
from collections import deque
from pathlib import Path
from urllib.parse import urlsplit

from cryptography.fernet import Fernet
from starlette.datastructures import Headers
from starlette.responses import JSONResponse


class Vault:
    def __init__(self, directory: Path, key):
        path = directory / "master.key"
        if key:
            raw = key.get_secret_value().encode()
        else:
            if not path.exists():
                import os

                fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(fd, "wb") as f:
                    f.write(Fernet.generate_key())
            raw = path.read_bytes()
        self.cipher = Fernet(raw)


class Guards:
    def __init__(self, app, settings):
        self.app, self.settings, self.windows = app, settings, {}

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        original_send = send

        async def send(message):
            if message["type"] == "http.response.start":
                additions = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"referrer-policy", b"no-referrer"),
                    (b"permissions-policy", b"camera=(), microphone=(), geolocation=()"),
                ]
                if scope["path"].startswith("/api/"):
                    additions.append((b"cache-control", b"no-store"))
                else:
                    additions.append(
                        (
                            b"content-security-policy",
                            b"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
                        )
                    )
                existing = {k.lower() for k, _ in message["headers"]}
                message = {
                    **message,
                    "headers": [
                        *message["headers"],
                        *((k, v) for k, v in additions if k not in existing),
                    ],
                }
            await original_send(message)

        headers = Headers(scope=scope)

        async def reject(code, detail, extra=None):
            await JSONResponse({"detail": detail}, status_code=code, headers=extra)(
                scope, receive, send
            )

        if self.settings.atlas_owner_token and scope["path"] != "/api/v1/health":
            expected = base64.b64encode(
                ("atlas:" + self.settings.atlas_owner_token.get_secret_value()).encode()
            ).decode()
            if not secrets.compare_digest(
                headers.get("authorization", "").encode(), ("Basic " + expected).encode()
            ):
                return await reject(
                    401,
                    "Owner access required.",
                    {"WWW-Authenticate": 'Basic realm="Atlas workspace"'},
                )
        mutating = scope["method"] in {"POST", "PATCH", "PUT", "DELETE"}
        protected = mutating and scope["path"].startswith("/api/")
        if protected:
            origin = headers.get("origin")
            if headers.get("x-atlas-request") != "1" or (
                origin
                and urlsplit(origin).netloc != headers.get("host")
                and origin not in self.settings.atlas_cors_origins
            ):
                return await reject(403, "Request origin is not allowed.")
        if protected or scope["path"] == "/api/v1/workspace":
            ip = (scope.get("client") or ("local",))[0]
            now = time.monotonic()
            if len(self.windows) > 4096:
                self.windows = {k: v for k, v in self.windows.items() if v and now - v[-1] < 60}
            window = self.windows.setdefault(ip, deque())
            while window and now - window[0] >= 60:
                window.popleft()
            if len(window) >= self.settings.atlas_request_limit:
                return await reject(
                    429, "Too many requests. Try again in one minute.", {"Retry-After": "60"}
                )
            window.append(now)
        if protected:
            buffer = bytearray()
            while True:
                msg = await receive()
                if msg["type"] == "http.disconnect":
                    return
                buffer.extend(msg.get("body", b""))
                if len(buffer) > 96000:
                    return await reject(413, "Request is too large.")
                if not msg.get("more_body"):
                    break
            sent = False

            async def bounded_receive():
                nonlocal sent
                if sent:
                    return await receive()
                sent = True
                return {"type": "http.request", "body": bytes(buffer), "more_body": False}

            return await self.app(scope, bounded_receive, send)
        return await self.app(scope, receive, send)

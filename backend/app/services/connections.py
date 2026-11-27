import asyncio

import httpx
from fastapi import HTTPException

from ..database.models import Integration
from ..integrations.adapters import request_json, search, weather
from ..tools.files import WorkspaceFiles
from ..tools.registry import ToolContext

CATALOG = {
    "gmail": (
        "Gmail",
        "Bring the important parts of your inbox into focus.",
        "Read selected messages",
    ),
    "notion": (
        "Notion",
        "Find notes and ideas across your knowledge base.",
        "Read selected pages",
    ),
    "drive": (
        "Google Drive",
        "Work with the files that power your projects.",
        "Read selected files",
    ),
    "slack": (
        "Slack",
        "Find context in conversations with your team.",
        "Read authorized channels",
    ),
    "calendar": (
        "Google Calendar",
        "Get a clear view of your upcoming schedule.",
        "Read selected calendars",
    ),
    "github": (
        "GitHub",
        "Understand code, issues and project documentation.",
        "Read selected repositories",
    ),
    "tavily": (
        "Tavily",
        "Search the web for current, source-backed information.",
        "Send search queries",
    ),
    "openweather": (
        "OpenWeather",
        "Check current conditions in cities around the world.",
        "Send city names",
    ),
    "groq": (
        "Groq",
        "Enable streaming AI responses and model-selected tools.",
        "Send prompts and enabled conversation context",
    ),
}
SERVICES = {"groq", "tavily", "openweather"}


def retrieve(state, repo, name):
    row = repo.db.get(Integration, (repo.user_id, name))
    if row and row.status == "error":
        return None
    if row and row.encrypted_key:
        return state.vault.cipher.decrypt(row.encrypted_key.encode()).decode()
    secret = getattr(state.settings, name + "_api_key", None)
    return secret.get_secret_value() if secret else None


def connections(state, repo):
    result = []
    for id, (name, description, permission) in CATALOG.items():
        row = repo.db.get(Integration, (repo.user_id, id)) if id in SERVICES else None
        configured = bool(getattr(state.settings, id + "_api_key", None))
        status = (
            row.status
            if row
            else ("configured" if configured else "available")
            if id in SERVICES
            else "coming_soon"
        )
        result.append(
            dict(
                id=id,
                name=name,
                description=description,
                permission=permission,
                status=status,
                managed=not row and configured,
            )
        )
    return result


def mark_rejected(repo, service):
    row = repo.db.get(Integration, (repo.user_id, service))
    if row:
        row.status = "error"
    else:
        repo.db.add(
            Integration(user_id=repo.user_id, service=service, encrypted_key="", status="error")
        )
    repo.db.commit()


def tool_context(state, repo, prefs):
    return ToolContext(
        WorkspaceFiles(state.settings.atlas_data_dir / "files" / repo.user_id),
        {k: retrieve(state, repo, k) for k in SERVICES},
        prefs.allow_network,
        on_rejected=lambda name: mark_rejected(repo, name),
    )


async def verify_and_save(state, repo, service, key):
    if service not in SERVICES:
        raise HTTPException(409, "This integration is on the roadmap, not connected.")
    try:
        async with asyncio.timeout(15), httpx.AsyncClient() as client:
            if service == "groq":
                d = await request_json(
                    client,
                    "GET",
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {key}"},
                )
                if not isinstance(d.get("data"), list):
                    raise ValueError()
            elif service == "tavily":
                await search(client, key, "Atlas connection test")
            else:
                await weather(client, key, "London")
    except Exception:
        # Keep a previous working key intact. Record a failed *first* verification
        # without retaining the rejected credential or any provider error body.
        if not retrieve(state, repo, service):
            repo.db.merge(
                Integration(
                    user_id=repo.user_id, service=service, encrypted_key="", status="error"
                )
            )
            repo.db.commit()
        raise HTTPException(
            400,
            "Could not verify this key. Check your credentials and network access. The key was not saved.",
        ) from None
    row = Integration(
        user_id=repo.user_id,
        service=service,
        encrypted_key=state.vault.cipher.encrypt(key.encode()).decode(),
        status="connected",
    )
    repo.db.merge(row)
    repo.db.commit()

import logging
from collections.abc import Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text

from .agent.provider import GroqProvider, Provider
from .core.config import ROOT, VERSION, Settings
from .core.security import Guards, Vault
from .database.repository import Database
from .schemas import Health


def create_app(
    settings: Settings | None = None,
    provider_factory: Callable[[str, str], Provider] = GroqProvider,
):
    cfg = settings or Settings()

    @asynccontextmanager
    async def lifespan(app):
        cfg.atlas_data_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        app.state.vault = Vault(cfg.atlas_data_dir, cfg.atlas_master_key)
        app.state.database = Database(
            cfg.atlas_database_url or f"sqlite:///{cfg.atlas_data_dir / 'workspace.db'}"
        )
        app.state.active = {}
        # HTTPX would otherwise log URLs, including OpenWeather's required query key.
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        yield
        app.state.database.engine.dispose()

    app = FastAPI(
        title="Atlas Workspace",
        version=VERSION,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url=None,
    )
    app.state.settings = cfg
    app.state.provider_factory = provider_factory
    app.add_middleware(Guards, settings=cfg)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.atlas_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "X-Atlas-Request"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return JSONResponse(
            {"detail": "Invalid input. Check the field values and size limits."}, status_code=422
        )

    @app.exception_handler(Exception)
    async def internal_error(request, exc):
        logging.getLogger("atlas").warning("Request failed: %s", type(exc).__name__)
        return JSONResponse(
            {"detail": "The workspace could not complete this request."}, status_code=500
        )

    @app.get("/api/v1/health", response_model=Health)
    def health():
        with app.state.database.engine.connect() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok", "version": VERSION}

    from .api.v1.routes import api

    app.include_router(api)
    dist = (ROOT / "frontend" / "dist").resolve()

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            return JSONResponse({"detail": "Unknown API route."}, status_code=404)
        candidate = (dist / path).resolve()
        if candidate.is_relative_to(dist) and candidate.is_file():
            return FileResponse(candidate, headers={"X-Content-Type-Options": "nosniff"})
        if path and "." in Path(path).name:
            return JSONResponse({"detail": "Asset not found."}, status_code=404)
        if (dist / "index.html").is_file():
            return FileResponse(dist / "index.html", headers={"Cache-Control": "no-cache"})
        return JSONResponse(
            {"detail": "API is ready. Run Vite or build the frontend."}, status_code=503
        )

    return app


app = create_app()

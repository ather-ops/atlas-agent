"""All secrets stay in the server process; Settings is never an API model."""

from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]
VERSION = "2.0.0"
MODELS = ("llama-3.3-70b-versatile", "llama-3.1-8b-instant")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"), extra="ignore", env_file_encoding="utf-8"
    )
    atlas_data_dir: Path = ROOT / ".atlas"
    atlas_database_url: str | None = None
    atlas_cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    atlas_environment: Literal["development", "production", "test"] = "development"
    atlas_owner_token: SecretStr | None = None
    atlas_master_key: SecretStr | None = None
    groq_api_key: SecretStr | None = None
    tavily_api_key: SecretStr | None = None
    openweather_api_key: SecretStr | None = None
    atlas_request_limit: int = Field(60, ge=1, le=600)

    @model_validator(mode="after")
    def safe_setup(self):
        if self.atlas_environment == "production" and (
            not self.atlas_owner_token or len(self.atlas_owner_token.get_secret_value()) < 24
        ):
            raise ValueError(
                "Production needs a private ATLAS_OWNER_TOKEN of at least 24 characters."
            )
        if any(
            urlsplit(x).scheme not in ("http", "https")
            or not urlsplit(x).netloc
            or "*" in x
            or urlsplit(x).username
            or urlsplit(x).path
            or urlsplit(x).query
            or urlsplit(x).fragment
            for x in self.atlas_cors_origins
        ):
            raise ValueError("Use explicit HTTP(S) origins, not wildcards.")
        return self

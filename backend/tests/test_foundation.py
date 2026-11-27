import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.app.core.config import Settings
from backend.app.main import create_app


def test_starts_without_keys(tmp_path):
    cfg = Settings(atlas_data_dir=tmp_path, _env_file=None)
    with TestClient(create_app(cfg)) as client:
        assert client.get("/api/v1/health").json() == {"status": "ok", "version": "2.0.0"}


def test_invalid_configuration():
    with pytest.raises(ValidationError):
        Settings(atlas_cors_origins=["*"])
    with pytest.raises(ValidationError):
        Settings(atlas_environment="production", atlas_owner_token=None)

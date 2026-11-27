# Setup and deployment

## Windows / personal development

Use Python 3.12 or newer and Node.js 22. The verified environment for this rebuild was CPython 3.12.13 / Linux and Node 22. Windows instructions are provided, not claimed as a Windows test run.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements-dev.txt
Copy-Item backend/.env.example backend/.env
npm --prefix frontend ci
npm --prefix frontend run build
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

If script execution is restricted, use `.\.venv\Scripts\python.exe` directly instead of changing the machine's execution policy. On Linux/macOS use `python3.12 -m venv .venv`, `source .venv/bin/activate`, and `cp backend/.env.example backend/.env`.

Open `http://127.0.0.1:8000`. The production frontend bundle and API use the **same origin**. Browser code always requests relative `/api/v1/...` URLs. `main:app` remains a compatibility alias for the new application.

### Hot reload

Run these in separate terminals from the repository root:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload --no-access-log
npm --prefix frontend run dev
```

Use the Vite URL printed in terminal two. Vite forwards `/api` to the backend, with the incoming host preserved. Its host allowlist permits Arena preview hosts. For a shared preview, bind the user-facing server to `0.0.0.0`. Do not put sandbox `localhost` URLs into browser code. Do not expose a key-bearing development instance publicly.

## Configuration and identity

Settings are read from environment variables and optional `.env` / `backend/.env` files. Real environment variables take priority. Example values are in [`backend/.env.example`](../backend/.env.example).

| Variable | Meaning |
|---|---|
| `ATLAS_DATA_DIR` | Private directory for SQLite, approved files and the local encryption key. Default `.atlas/`. |
| `ATLAS_DATABASE_URL` | SQLAlchemy URL override. SQLite is the tested database. PostgreSQL requires a driver, migrations and migration tests before use. |
| `ATLAS_CORS_ORIGINS` | JSON array of explicit origins. Same-origin deployment is recommended. Wildcards are rejected. |
| `ATLAS_ENVIRONMENT` | `development`, `test`, or `production`. Production refuses to start without a sufficiently long owner token. |
| `ATLAS_OWNER_TOKEN` | Private, operator-generated application access token, at least 24 characters in production. HTTP Basic username is `atlas`. This is **not** a third-party account password. |
| `ATLAS_MASTER_KEY` | Optional Fernet key from a secret manager. Without one, a key is generated in the private data directory. Back it up securely; do not change it without re-encrypting stored credentials. |
| `GROQ_API_KEY`, `TAVILY_API_KEY`, `OPENWEATHER_API_KEY` | Optional server credentials. No `VITE_` secrets. Per-workspace verified keys override server defaults. |
| `ATLAS_REQUEST_LIMIT` | Combined per-client mutation/bootstrap limit per minute. Default 60. |

Each browser receives a random, HTTP-only workspace cookie. Only its digest is stored. Chats survive reloads and server restarts **with the same cookie and data directory**. Clearing cookies or using a different origin creates a different workspace. This is not account recovery or cross-device sign-in. HTTPS cookies are Secure and partitioned for embedded previews. Application startup recovers interrupted turns as stopped.

## Provider setup

- **Groq:** Settings → Agent & model → Configure key. Verification fetches the model catalog. Choose one of the two supported Llama models. Catalog verification is not proof that a particular model is available to every account.
- **Tavily:** Integrations → Tavily → Configure service. Verification performs one explicitly disclosed test search, which may use a credit.
- **OpenWeather:** Integrations → OpenWeather → Configure service. Verification requests current conditions for London.
- An unverified environment key is labeled **Server configured**, not **Connected**. Rejected keys are not saved. A revoked credential that returns an authorization failure is marked **Error**; timeouts do not silently revoke working credentials.
- Removing a workspace key reverts to the server default, if one exists. Environment secrets must be removed in the hosting environment. Disable external tools or choose Local tools only to opt out.

The optional provider smoke tests require permitted outbound access to `api.groq.com`, `api.tavily.com` and `api.openweathermap.org`. No live provider account was available in the build sandbox.

## Tests

```bash
python -m pip install -r backend/requirements-dev.txt
python -m pytest -q
npm --prefix frontend ci
npm --prefix frontend run build
cd frontend
npx playwright install chromium
npm run test:e2e
```

On a minimal Linux host use `npx playwright install --with-deps chromium`. Activate the Python environment before running Playwright. By default it starts FastAPI on port 8001 with a **temporary database, no vendor keys and a test-only rate budget**. Each test gets a fresh browser workspace. For a separate disposable test deployment set `ATLAS_TEST_URL`; never point these tests at a real personal workspace. `ATLAS_CHROMIUM_PATH` optionally selects an installed browser.

Live checks are intentionally excluded by default. To run them on a machine with the relevant service credentials and network access, explicitly set `ATLAS_RUN_LIVE=1` (`$env:ATLAS_RUN_LIVE='1'` in PowerShell), then run `python -m pytest -q backend/tests/test_live_providers.py`. They make paid or quota-consuming requests with fixed, non-private prompts. Do not publish keys or transcripts in CI output.

## Production / Docker

The multistage Dockerfile builds TypeScript with Node and copies only the output into a non-root Python 3.12 runtime. It uses the pinned Python lock and npm lockfile. The health endpoint is `GET /api/v1/health`; it verifies a database query, not third-party uptime.

1. Set a unique `ATLAS_OWNER_TOKEN` in your shell or private root `.env`. Generate one locally with `python -c "import secrets; print(secrets.token_urlsafe(32))"`. Store it in a password manager.
2. Run `docker compose up --build -d`. The default published port is **loopback-only** at `127.0.0.1:8000`. The service uses a named volume at `/var/lib/atlas`.
3. Use an HTTPS reverse proxy for remote access. Preserve the host, pass trusted scheme information, disable proxy buffering on chat streams, and set stream timeouts above the 70-second turn deadline. Do not trust arbitrary forwarded client-IP headers.
4. Sign in with username `atlas` and the operator token. Do not share that token in a public demo. The health endpoint alone is unauthenticated.
5. Back up the database, files and encryption material together. Only authorized operators should access the volume. Do not use `docker compose down -v` unless you intend to delete the data.

For a non-Docker production host: install `requirements.txt`, run `npm ci` and `npm run build` in `frontend`, set the same production environment, and run `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 1 --no-access-log` behind TLS. One worker is required for the current cancellation registry/rate limits and SQLite deployment model.

### Render

`render.yaml` describes a **single Docker web service with a persistent disk**. Import the blueprint, supply an owner token as a secret, and optionally add vendor keys in Render's environment settings. The container respects `PORT`. A disk-capable plan is needed; the example uses a paid starter plan. This repository change does not provision or deploy a service. Do not reuse the alpha free/ephemeral deployment for persistent personal conversations.

Docker and hosted rollout still require smoke testing on the target host. No Docker engine or Render deployment was available for this verification run.

# Atlas Alpha → 2.0: technical audit

Baseline: `f00cb8587bd2a8b68f065b7e3e7f75ddab040c84`, reviewed before implementation on the assigned rebuild branch. The baseline remains recoverable in Git. Existing artwork, video, license, maintainer attribution and vulnerability reporting policy should be retained.

## Existing architecture and findings

The HTML landing page submits one string to `/chat`. A process-global smolagents CodeAgent uses an OpenAI-compatible Groq model and eight decorated functions. FastAPI serves static assets; a second Gradio entry point and a side-effectful test script also exist. There is no repository, persisted history, user boundary, streaming protocol or automated test suite.

| Evidence | Risk / finding | Decision |
|---|---|---|
| `atlas/tools.py`: in-process Python execution, character-filtered calculator, arbitrary paths and truncating writes | Untrusted input can affect the application or exhaust resources. | Retire these implementations. Bounded arithmetic AST, private workspace files, exclusive creation with explicit confirmation, isolated interpreted Python subset. |
| `atlas/config.py`, `atlas/agent.py`, `atlas/tools.py` | Missing Groq key raises at import; Tavily client constructed even when search isn't needed. A missing optional dependency can take down unrelated tools. | Validate settings at startup, lazy provider access, independently report tool and provider availability. |
| `main.py` | Blocking `agent.run` in async route, shared agent, unlimited input, wildcard credentialed CORS, raw exceptions returned with HTTP 200, prompts and results printed. | Per-turn bounded graph, typed requests, SSE, scoped sessions, explicit origins, sanitized errors and no transcript logging. |
| `app.py`, `gradio_app.py` | Importing launches network calls, file writes or a server; filenames suggest interchangeable entry points when they are not. | One application factory and side-effect-free tests. |
| `requirements.txt`, `render.yaml`, `runtime.txt` | UTF-16LE BOM freeze includes both UI frameworks, transitive and interpreter-specific packages; Render pins 3.11 while `numpy==2.5.1` requires Python ≥3.12 and `audioop-lts==0.2.2` requires ≥3.13 (verified against their published package metadata). The freeze cannot install as specified on Render 3.11. No tested lock or `.env.example`. | Python 3.12 runtime, minimal direct dependencies, verified install and a repeatable deployment build. |
| Legacy imports / network adapters | Internal module names resolve statically, and the pinned smolagents wheel contains the legacy `OpenAIServerModel` symbol. Clean-environment import failed first at missing `fastapi`; no basis for claiming the old adapters pass live tests. Synchronous weather call has no timeout; search and weather propagate provider details. | Typed asynchronous HTTPS adapters, explicit network deadlines, bounded results, mock-transport contracts and separate live verification. |
| `frontend/index.html`, `script.js`, `chat.js`, `styles.css` | Relative URLs and text-only DOM rendering are useful. History is DOM-only, errors masquerade as answers, messages logged to console, unrelated response shapes guessed, unused external stylesheet vs inline CSS. Navigation click hides desktop links. Stats include literal `30+` and optimistic fallback counts. | One TS client and versioned contract, escaped Markdown, database-backed metrics, navigation and accessible loading/error/empty states. |
| `/health`, README, deployment | Static health claims online even without checking provider; missing persistence volume, auth boundary, upload limits, confirmations or rate limits. Raw-hosted logo and external fonts needed at runtime. | Separate liveness, database readiness and provider configuration. Local assets, owner-gated production, durable volume, scoped cookies and quotas. |

No provider credentials were present in the starting environment. This audit did not execute the unsafe tools or probe a remote deployment. The original alpha marketing claims are not verification results.

## Proposed architecture

React/Vite → same-origin `/api/v1` → FastAPI services → per-request LangGraph → provider / validated tool registry → observation and bounded response. A SQLAlchemy repository owns workspace-scoped records in SQLite. Conversation context is recent, bounded history, not long-term memory. External documents/results are untrusted data, never action authorization. Future app cards are a catalog, not OAuth connections.

## Development gates and dependencies

1. **Audit**: inspect tracked source, configurations, documentation and asset inventory (this document).
2. **Foundation**: Python 3.12, FastAPI, Uvicorn, Pydantic Settings; health and startup validation.
3. **Agent/tools**: LangGraph and HTTPX for Groq-compatible streaming, Tavily and OpenWeather; safe standard-library local tools, limits and tests.
4. **Conversation foundation**: SQLAlchemy and SQLite, workspace isolation, bounded context, persistence and deletion tests. Long-term memory remains future work.
5. **Interface**: React, Vite, TypeScript, Tailwind, shadcn-style Radix primitives, Lucide, Framer Motion, Markdown and syntax highlighting. Responsive overview, chat and supporting pages.
6. **End to end**: same-origin streaming, stop/retry, attachments, preferences and reopen chat. Verify across the real HTTP boundary.
7. **Connections / workflows**: encrypted server-side credentials with `cryptography`, constrained manual workflows and real execution history. Gmail, Notion, Drive, Calendar, Slack and GitHub are explicitly coming soon; no pretend OAuth or schedules.
8. **Release gate**: pytest + HTTPX contract tests, TypeScript/build checks, browser smoke tests, Windows/local/Docker/Render documentation. Distinguish mocked provider checks from live checks.

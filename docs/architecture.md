# Architecture

## Boundaries

```text
React / TypeScript workspace (Vite in development; static bundle in deployment)
    │  relative /api/v1, HTTP-only workspace cookie, mutation marker
    ▼
FastAPI ─ guards / validated schemas ─ workspace-scoped repository
    │                                        │
    │                                SQLAlchemy → SQLite / WAL
    ▼
Per-turn LangGraph: classify → respond or tool → observe → finish
                                  ▲               │
                                  └─ bounded loop ┘
    ├── Provider protocol → Groq OpenAI-compatible streaming adapter
    ├── Registry → input model → permission checks → deadline → structured result
    └── Public events → SSE → UI; terminal state and partial output → database
```

**The browser is never the authority for success.** Counters come from SQL queries. A manual workflow records the actual tool result. A key is only labeled connected after a successful upstream verification. The planned app catalog cannot authorize an operation.

## Agent lifecycle

`agent/graph.py` keeps a typed state, local intent router and four graph nodes together. Each request gets a new graph state and independently bounded context. `agent/provider.py` defines the replaceable provider protocol; HTTPX implements Groq's streamed `content` and fragmented `tool_calls` protocol without introducing a second orchestration framework.

Simple clock, calculation, explicit read/write and service queries take a deterministic path. General requests use a model when configured. Without one, Atlas explains its local capabilities rather than inventing a generated answer. External text is labeled as data. **After reading untrusted tool output, no further tool calls are allowed in that turn.** Attachments disable tools for the entire turn. Source URLs remain available for attribution.

- Maximum **three tool calls** and 12 graph steps per turn.
- Provider calls retry once on selected transient statuses, before emitting any output; no blind replay after a partial stream.
- Instrumentation contains public activity labels and tool status, never intermediate private reasoning.
- 70-second turn limit, 15-second tool deadline, 12-second external-request timeout and 3-second Python subprocess timeout. Local synchronous operations are bounded by small inputs and regular private files.
- A session-bound stop request races the graph iterator, including time spent waiting for a provider. Failure and cancellation preserve partial content. Only one live turn is allowed per workspace.

## Data and memory

`database/repository.py` centralizes workspace identity, ownership, conversation queries and aggregate metrics. SQLAlchemy models cover users, preferences, conversations, messages, agent sessions, tool executions, encrypted integration credentials, workflows, workflow runs and expiring pending writes. Foreign keys and cascades are enabled in SQLite. Identifiers are UUIDs and timestamps are UTC.

`services/memory.py` selects at most ten complete prior messages from **this conversation**, capped at 2,400 characters each. Disabling context does not delete saved history. No long-term profile inference, vector database or cross-chat memory is implemented. Uploaded text is stored with the user turn, not published as a static file. Deleting a conversation removes its messages, associated tool records and pending writes; it does not remove files the user approved separately.

Fernet protects saved provider credentials. The database itself is not encrypted: use filesystem/volume encryption if required. The server can use a supplied master key or a generated local key. See [setup](setup.md) for backup and cookie behavior.

For PostgreSQL, introduce tested schema migrations and a database driver, then migrate the repository with ownership/cascade tests. `create_all` initializes this milestone; it is **not a schema migration system**. Before multiple replicas, move rates, cancellation and workflow jobs to shared infrastructure.

## Tool permissions

The fixed registry describes input schemas and availability. `execute` returns a structured success/failure, text, trust marker and optional write proposal. No shell tool exists. Date and system tools cannot enumerate the host. Math uses an operator allowlist, bounded AST size, numeric range, exponent and depth.

File operations accept only simple text filenames under the authenticated user's private directory. Reads reject links and oversized files. Writes are exclusive creates: the agent can **propose**, but only the separate human approval endpoint can commit the exact filename and contents. Proposals expire in ten minutes. Declining or replaying a resolved proposal cannot produce another write.

The Python tool runs `code_worker.py` as a separate isolated interpreter process with no inherited environment or user-controlled command-line arguments. It interprets only numeric assignments and single-argument `print` statements. No `eval`, `exec`, imports, loops, attribute access, networking or host I/O is exposed by that language. POSIX builds also apply CPU/address-space limits. This is deliberately not a general Python sandbox.

## API contract

Bootstrap the cookie with `GET /api/v1/workspace` before accessing workspace data. State changes require `X-Atlas-Request: 1`, JSON input where applicable, and an allowed origin. Invalid input returns a sanitized 422, not echoed request bodies. API responses are not cacheable.

| Endpoint (under `/api/v1`) | Purpose |
|---|---|
| `GET /health`, `GET /workspace`, `GET /agent/status` | Readiness, private bootstrap, configured operating mode. |
| `POST /chat`, `POST /agent/stop` | Stream a turn, regenerate the last response, stop a specific owned session. |
| `GET /conversations`, `GET/DELETE /conversations/{id}` | List, reopen or delete owned history. |
| `GET /tools`, `POST /actions/{id}` | Schemas/availability and explicit approve/decline. |
| `GET /integrations`, `PUT/DELETE /integrations/{service}` | Catalog, verify/write a key, remove an override. |
| `GET/POST /automations`, `GET/PATCH /automations/{id}`, `POST /automations/{id}/run` | Manual workflow definitions, state and execution history. |
| `GET/PUT /settings` | Validated non-secret preferences. |

`POST /chat` returns `text/event-stream`, not a JSON response envelope. Each complete SSE frame contains a JSON `type`: `start` (conversation, message and session IDs), `activity`, `tool`, `approval`, `delta`, `error` or `done`. Text deltas may be split across HTTP chunks; the client buffers complete lines. Pre-stream validation uses HTTP status codes. After the stream begins, an `error` event and terminal status distinguish failure from a normal reply. The machine-readable REST schema is at `/openapi.json`.

## Frontend

Five React Router routes share a collapsible rail, keyboard search, Radix-backed shadcn/ui dialogs, light/dark theme tokens and local type/brand assets. Overview and new Chat share an `AssistantStudio` welcome, prompt catalog and `Composer`. Both submit directly to the same stream; typed drafts and attachment text are not passed through URL or browser history. Prompt starters fill the draft but do not create a conversation until submission. Real counters, recent conversations and workflow activity live in the on-demand Workspace panel. Markdown export reads the owned conversation and downloads it locally, without creating a public link. Framer Motion is limited to low-amplitude interaction feedback and respects reduced motion. Markdown ignores raw HTML, external images are not automatically fetched, and syntax highlighting is lazy-loaded.

Display names are optional and scoped to the private workspace cookie, not inferred from the operator, browser or connected services. The settings API keeps its `name` field. In storage, a distinct `display_name` key separates explicit choices from the old sample default inadvertently saved with other preferences. A legacy custom name is retained; an ambiguous legacy sample name must be confirmed by entering it again. Clearing the name restores the neutral welcome without disabling other settings.

The chat window’s colored edge follows the transcript’s `aria-busy` state for the active request, including regeneration. It does not add time to fast replies or intercept pointer events. Reduced-motion users see a static edge; leaving the chat, failure, completion and cancellation remove the effect.

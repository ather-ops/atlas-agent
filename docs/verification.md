# First milestone: verification record

Verified on 2026-11-27, on the assigned rebuild branch, against the actual FastAPI service and production React bundle. Environment: CPython 3.12.13, Node 22.22.3, SQLite 3.40.1, Linux, headless Chromium. The audit baseline is `f00cb8587bd2a8b68f065b7e3e7f75ddab040c84`.

| Engineering gate | Implemented and checked | Boundary / remaining work |
|---|---|---|
| 1. Audit | Inspected all tracked source, README, security policy, runtime/deployment files and historical asset inventory. Confirmed incompatible Python requirements against published metadata. | No unsafe legacy execution or probing of a deployed service. See [audit](audit.md). |
| 2. Foundation | Clean install, health query, startup without keys, explicit-origin and production-owner validation. | One worker and private deployment; not SaaS identity. |
| 3. Agent/tools | All eight tool contracts, bounded arithmetic, isolated Python, write proposals, service payload contracts, native streamed tool-call assembly, retry and loop limits. | External network responses are fixtures in automated tests. The Python language is deliberately restricted. |
| 4. Persistence | Owned conversations/messages, preferences, execution records, reload, regeneration, deletion, user isolation and persistence across two application lifespans using the same database. | No cross-device account recovery or long-term user memory. |
| 5. Interface | TypeScript check and production Vite build; inspected the floating workspace on desktop (1440×950 and 1366×768), tablet (820×1180) and mobile (390×844), plus desktop dark mode. All five routes navigated at 390 px without horizontal overflow. | Desktop and mobile Chromium tested; Safari, Firefox and native Windows remain target-platform checks. |
| 6. End to end | Overview submission → FastAPI → LangGraph → calculator → SSE → saved conversation. Vite proxy also returned the real result **180** for `(48 + 12) * 3`. Explicit cancellation interrupts a waiting graph and retains partial text. | Local answers may arrive in one delta. Groq streams actual provider deltas, not a simulated typewriter. |
| 7. Services/workflows | Browser-tested text attachment, file approval, actual manual workflow result, pause/resume and persisted history. Tests verify credential encryption, redaction, failed verification, disconnect and future-app rejection. | OAuth apps and timed scheduling remain unavailable. No success notification substitutes for execution. |
| 8. Release preparation | Python lock, npm lock, non-root Dockerfile, Compose volume, Render disk, CI recipe, docs, rate/size limits, security headers and negative tests. Parsed deployment YAML and verified the serving process and database health. | Docker image and Render deployment have **not** been run here. No public service was created. |

## Results

- **Backend: 37 passed, 3 intentionally skipped.** The skipped tests are explicitly opt-in live Groq, Tavily and OpenWeather checks, not ignored test failures.
- **Browser: 11 passed** against a fresh real backend with a disposable SQLite database. Covers library/search, coming-soon states, text streaming, persistent history, regeneration, clipboard, deletion, approved file writes, attachment overview, workflows, settings/theme persistence, all five mobile routes, and syntax-highlighted code copying. The final design pass also checks the contents of the downloaded Markdown export, the on-demand workspace summary, welcome-screen attachment validation and submission, suggestion shuffle, persisted agent mode, rail collapse and keyboard shortcuts.
- **Frontend:** strict TypeScript check and production build succeeded. Fonts, illustrations and app marks are served locally. In a live chat at 844×390 landscape, the send control remained in view with 167 px available for scrolling the transcript.
- **Hygiene:** Ruff checks passed; installed Python packages have compatible requirements. The npm production dependency audit reported zero known advisories at check time. This is not a security guarantee.

### Final greeting and reply indicator

- Fresh workspaces have no display name. Browser tests set a multiword name, reload, check a second independent browser context, and clear the name. API tests cover Unicode, the length limit, isolation and old seeded versus chosen names while preserving other preferences.
- The edge is absent while typing, present while a chat request is pending, and absent again after a real calculator result (`6 × 7 = 42`). Playwright intercepts transport to observe the pending state and exercise network failure and cancellation without depending on vendor latency. Regeneration uses the same indicator and reduced-motion mode keeps the colors static. The separate backend stop test covers cancellation during an already-running session.

### What the provider tests prove

The Groq wire-to-workspace test replaces only the upstream HTTP transport. The real Groq adapter parses native tool calls; the real graph invokes the calculator; its result goes into the second provider request; final text deltas traverse the API and are persisted. Separate tests cover fragmented deltas and retry limits. Tavily/OpenWeather tests check the HTTPS method, destination, payload, credential placement, parsed result, missing-key behavior and error handling.

These checks **do not establish live model availability, account entitlement or vendor uptime**. No vendor credentials were supplied, and the sandbox does not permit outbound connections to those API hosts. Run the opt-in checks on a permitted network before calling a real deployment fully verified. See [setup](setup.md#tests).

## Reproduce

```bash
python -m pytest -q
npm --prefix frontend ci
npm --prefix frontend run build
# With the Python environment active and a Playwright browser installed:
npm --prefix frontend run test:e2e
```

The shared preview serves the built application and API on one origin. The development-proxy smoke test was also run separately, including acceptance of a preview-style host. No frontend fixture service, sample history, fake activity counters or live OAuth claims are used.

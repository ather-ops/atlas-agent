# Product roadmap

## First milestone: personal workspace

A real local-tool assistant, Groq adapter, persistent conversation history, approval-gated files and safe manual workflows. This is the foundation being verified, not a claim of production SaaS readiness.

## Future app phases 4–5: coming soon

Gmail, Notion, Google Drive, Slack, GitHub and Google Calendar are **planned integrations**. Their logos, descriptions and proposed permission boundaries are visible. No OAuth handshake, remote action or account access is implemented for these apps.

The exact scope, phase assignment and release dates have **not yet been decided**. These future product phases are separate from the engineering sequence used to deliver the current database and interface.

## Decisions before the next milestones

- Which single read-only integration provides enough value to justify its OAuth scopes, consent flow, token rotation and revocation support?
- Which document types need isolated parsers, file scanning and stronger content-policy boundaries? PDF extraction, Excel analysis, browser control, images, audio and video are not supported today.
- Which manual workflows warrant a durable job queue, idempotent execution, scheduling with time zones, retry policies and a human approval inbox?
- What saved memory should the owner explicitly opt into, inspect, edit and erase? Conversation persistence is not long-term memory.
- Before shared SaaS: authenticated accounts and recovery, migrations, PostgreSQL, tenant isolation review, secret management, quotas, monitoring, backups, audit logs and independent security testing.

No schedules, email sends, repository modifications, browser automation or arbitrary Python execution are presented as available.

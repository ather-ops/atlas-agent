# Security policy

Report suspected vulnerabilities through a private GitHub security advisory if enabled, or contact the maintainer privately. Do not post credentials, personal chats, unredacted logs or sensitive reproduction material in a public issue. Report the affected revision, expected boundary and impact. Rotate any exposed key through its issuing service.

## Supported scope

The current 2.0 personal-workspace code is the supported development line. The archived Alpha implementation is not safe for public deployment: its file and Python tools ran with server privileges. Preserve it in Git history, not as an alternate live endpoint.

## Operational requirements

- Use **one worker**, owner-gated production mode, HTTPS, a private persistent data directory and tested backups. Do not expose an unprotected development server with real service keys.
- The operator token gates the deployment. A random HTTP-only cookie isolates each browser workspace. These are not enterprise identity, account recovery or a multi-user authorization system.
- Saved service keys are encrypted server-side and never returned. Keep the encryption key, environment secrets, SQLite data and backup material out of Git. A compromise of both the data volume and its local master key defeats at-rest key encryption; use a separately managed key where appropriate.
- Conversations and approved text files are **not** encrypted by the application. Model calls send the prompt, included history and attachments to Groq. Search and weather send authorized queries/city names to their respective providers. Use Local tools only and disable external tools for offline work.
- External content is data, not authorization. Tool inputs have limits and schemas, untrusted observations close the tool loop, and creating an immutable workspace file requires explicit confirmation. No email sending, destructive file operations, remote GitHub writes or free-form shell execution is available.
- Uploads are bounded UTF-8 text only. Do not generalize this implementation into a PDF parser, browser agent or general-purpose code runner without a new threat model.
- In-process rate limits and execution budgets supplement, but do not replace, a TLS reverse proxy, infrastructure-level abuse protection and resource limits.

The included negative tests and contract tests are engineering safeguards, not an independent penetration test or security certification. See [architecture](docs/architecture.md) and [verification](docs/verification.md).

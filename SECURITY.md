# Security Policy

## Supported Versions

Atlas Agent is currently under active development. Security updates and bug fixes are provided only for the latest development version.

| Version | Supported |
|---------|-----------|
| Alpha (main) | Yes |
| Pre-Alpha | No |
| Archived Releases | No |

---

## Reporting a Vulnerability

If you discover a security vulnerability in Atlas Agent, please report it responsibly.

### How to Report

If GitHub Security Advisories are enabled for this repository, please submit a private security advisory.

If they are not available, contact the project maintainer privately instead of opening a public issue.

Please include the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Potential impact
- Screenshots or logs (if applicable)

---

## Response Process

Every reported vulnerability will go through the following process:

1. Acknowledgement within 72 hours.
2. Investigation and validation of the report.
3. Severity assessment.
4. Development and testing of a fix.
5. Security patch release if required.
6. Public disclosure after the issue has been resolved.

---

## Scope

This security policy applies to:

- Atlas Agent source code
- Python modules
- Tool implementations
- Configuration files
- API integrations
- Environment variable management

Third-party services including Hugging Face, OpenWeather, GitHub, or any other external providers follow their own security policies.

---

## Security Best Practices

When contributing to Atlas Agent:

- Never commit API keys, access tokens, passwords, or secrets.
- Store sensitive credentials inside a `.env` file.
- Keep `.env` listed in `.gitignore`.
- Rotate exposed credentials immediately if they are accidentally leaked.
- Validate all user input before processing.
- Keep project dependencies updated.
- Follow the principle of least privilege when integrating external services.
- Review code before merging changes.

---

## Responsible Disclosure

Please do not publicly disclose security vulnerabilities until they have been investigated and resolved. Responsible disclosure helps protect users while allowing sufficient time to develop and release a fix.

---

## Project Status

Atlas Agent is currently an Alpha-stage open-source project. Security practices, dependency management, and vulnerability response procedures will continue to improve as the project evolves toward a production-ready autonomous AI platform.

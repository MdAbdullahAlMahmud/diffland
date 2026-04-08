# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Email `security@diffland.dev` with:

- A description of the issue
- Steps to reproduce
- Affected versions
- Any mitigation you've identified

We aim to acknowledge reports within 72 hours and provide a fix or mitigation plan within 90 days.

## Supported versions

During the `0.x` phase, only the latest minor version receives security fixes.

## Scope

diffland executes `git` locally. The primary attack surface:

- Parsing untrusted diff output
- Config file (`.diffland.json`) parsing
- The local HTTP/WebSocket server (`--watch` mode, bound to `localhost` only)
- Any code paths that shell out

Out of scope:

- Attacks requiring local filesystem access already equivalent to "has shell"
- Vulnerabilities in transitive dependencies (please report upstream)

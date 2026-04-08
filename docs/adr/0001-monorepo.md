# ADR-0001: Monorepo with pnpm workspaces + turborepo

- **Status:** Accepted
- **Date:** 2026-04-08

## Context

diffland ships as a CLI, a React UI, a TUI, an SVG exporter, a VS Code extension, a GitHub Action, a Python adapter, and eventually a Rust binary. All of these share a single data contract (`DiffLandData`) and a single design system.

We needed to decide between:

1. **Polyrepo** — one repo per package, loose coupling via npm
2. **Monorepo** — one repo, workspaces, shared tooling

## Decision

Monorepo, pnpm workspaces, turborepo for the task graph.

## Consequences

**Positive**

- Atomic changes across `core` and its consumers (e.g., a schema bump + all view updates in one PR)
- Single source of truth for lint, prettier, tsconfig, CI
- Contributors clone one repo and have everything working in 5 minutes
- Turborepo caches make CI fast even as package count grows

**Negative**

- Slightly higher barrier to contribute a tiny change (must understand the whole layout)
- Release tooling is more involved — solved via changesets

## Alternatives considered

- **Nx**: more features but heavier than we need for a mostly-TypeScript project
- **Lerna**: in maintenance mode; changesets covers its use cases
- **Polyrepo**: rejected — the coordination cost for cross-cutting changes (schema bumps especially) would be painful forever

# ADR-0002: `@diffland/core` is pure (no I/O)

- **Status:** Accepted
- **Date:** 2026-04-08

## Context

diffland must run in many environments: Node CLI, browser playground, VS Code extension, CI GitHub Action, and eventually a Rust port. Each has different I/O primitives (Node `fs`, browser IndexedDB, isomorphic-git, etc.).

If the parsing/tree-building logic imports `fs` or `child_process` directly, it becomes unreachable from the browser and tightly coupled to Node. Tests become slow and flaky because they need real git repos on disk.

## Decision

`@diffland/core` must not import `fs`, `child_process`, `path` (for I/O — type-only is fine), or any git library. All I/O flows through two interfaces defined in `core`:

```ts
interface GitProvider { /* nameStatus, numstat, currentBranch, … */ }
interface FsProvider { /* readFile, stat, listFiles */ }
```

Concrete implementations live in separate packages:

- `@diffland/git-node` — Node.js via `simple-git` + `fs/promises`
- `@diffland/git-iso` — browser via `isomorphic-git` (Phase 3+)

This is enforced by:

1. An ESLint `no-restricted-imports` rule that blocks `fs` / `child_process` outside `packages/git-*`
2. A `boundaries/element-types` rule that prevents `core` from importing any provider or renderer package
3. CI lint gate

## Consequences

**Positive**

- Core is unit-testable in milliseconds using in-memory fakes
- Core runs in the browser unmodified (the playground does this on day one)
- Porting core to another language means porting pure functions — no I/O adapter churn
- Security surface is concentrated in a small, easily audited set of files

**Negative**

- Slightly more boilerplate (one extra package for the provider impl)
- Contributors must learn where the "I/O boundary" is — mitigated by lint errors catching mistakes immediately

## Alternatives considered

- **Dependency injection via function parameters only** (no interfaces): rejected — loses type safety and makes the API unwieldy
- **Allow core to use `fs` behind a flag**: rejected — the moment a flag exists, someone will bypass it and the architectural guarantee evaporates

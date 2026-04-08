# Contributing to diffland

Thanks for your interest! diffland aims to be a welcoming, well-architected open source project from day one.

## Ground rules

1. **Read [`DIFFLAND_ARCHITECTURE.md`](./DIFFLAND_ARCHITECTURE.md)** — especially §2 (Design principles) and §3 (dependency rule). PRs that violate the dependency rule will be blocked by CI.
2. **`@diffland/core` is pure.** No `fs`, no `child_process`, no git calls. I/O goes through providers.
3. **One data contract.** All renderers consume `DiffLandData`. If you need new data, extend the schema with an additive change — don't pass extras through side channels.
4. **Ship small.** Prefer multiple focused PRs over one giant one.

## Dev setup (should take <5 min)

```bash
git clone https://github.com/diffland/diffland
cd diffland
pnpm install
pnpm build
pnpm test
```

Requires Node 18+ and pnpm 9+.

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/). Husky's `commit-msg` hook enforces this.

```
feat(core): parse renames in numstat output
fix(ui): tile glow animation honors prefers-reduced-motion
docs(adr): add ADR-0003 for provider interface
```

Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## Pull requests

- One logical change per PR
- Update/add tests — `@diffland/core` has a 90% coverage gate
- UI changes must include a screenshot or Storybook link
- Link the issue the PR closes (`Closes #123`)
- Be patient — maintainers respond as time allows

## Adding a new view

Views are plugins. See the plugin authoring guide (lands in Phase 6). A view is `(data: DiffLandData) => ReactNode` plus metadata. Do not reach outside `DiffLandData`.

## Proposing architectural changes

Significant changes need an ADR. Copy `docs/adr/0001-monorepo.md` as a template and open a PR.

## Code of conduct

By participating you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md).

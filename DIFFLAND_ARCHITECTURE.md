# diffland

> **Spatial git diff visualizer — see your codebase as a living village, not a wall of text.**

Built for the LLM coding era, where AI agents like Claude Code or Cursor touch dozens of files in one shot and you need to *see* the blast radius before you review or commit.

[![npm version](https://img.shields.io/npm/v/diffland)](https://npmjs.com/package/diffland)
[![CI](https://github.com/diffland/diffland/actions/workflows/ci.yml/badge.svg)](https://github.com/diffland/diffland/actions)
[![codecov](https://codecov.io/gh/diffland/diffland/branch/main/graph/badge.svg)](https://codecov.io/gh/diffland/diffland)
[![license](https://img.shields.io/npm/l/diffland)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## 1. What it does

`git diff` tells you *what* changed in text. **diffland** shows you *where* it changed — spatially, visually, instantly.

Every file in your repo is a tile on a dark green ground. Directories are rows. When a file changes it glows with fire 🔥, sparkles ✨, or a skull 💀. The whole layout looks like a Clash of Clans village — buildings on the earth, changed ones lit up and alive.

**Key insight:** Existing tools (Git-Heat-Map, Gource, git-treemap) visualize *historical* activity over time. diffland visualizes **the current working tree diff, right now** — designed for the moment an AI agent rewrites 20 files and you need to understand the blast radius before you commit.

**Why "diffland"?** `diff` is the universal developer word for changes. `land` evokes the ground/terrain metaphor — your codebase is a landscape, changed files are landmarks that glow.

---

## 2. Design principles (read this first)

These principles govern every architectural decision below. When in doubt, pick the option that upholds the most of these.

1. **Core is pure, sync, and portable.** `packages/core` has zero I/O, zero git calls, zero filesystem access. It takes plain data in and returns plain data out. This is what makes it trivially testable, portable to any language, and embeddable in VS Code / browser / CI.
2. **Adapters do I/O.** All git, filesystem, and process spawning lives behind a `GitProvider` / `FsProvider` interface. Swap them for tests, for in-browser (via `isomorphic-git`), or for a remote repo.
3. **One data contract.** `DiffLandData` is the single serializable artifact every view consumes. It has a version field. Breaking it bumps major. This is the contract between core and every renderer (browser, TUI, VS Code, SVG, JSON).
4. **Views are pluggable.** A view is `(data: DiffLandData) => ReactNode`. New views ship as modules, not as forks.
5. **Performance budgets are explicit.** Parse 2k files in <500ms. First paint <1s. Re-render on watch event <100ms. Every PR runs a benchmark against a fixture repo; regressions block merge.
6. **Open-source ergonomics from day one.** MIT license, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates, semantic-release, changesets, conventional commits, and a 5-minute local dev loop — all before v0.1.
7. **Ship small, ship often.** v0.1 is a working village view on one repo. Everything else is additive.
8. **No lock-in.** JSON output is a first-class citizen. If diffland ever dies, your data piped through `--json` still works with any tool.

---

## 3. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entry points                            │
│    CLI · TUI · VS Code ext · GH Action · Web playground · SDK  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ all call…
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    @diffland/core (pure)                        │
│  parser · tree · blast · imports · types · schema (versioned)  │
│                                                                 │
│  Inputs:  GitProvider, FsProvider, Config                       │
│  Output:  DiffLandData  (serializable, versioned)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ DiffLandData flows to…
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
┌─────────────┐    ┌───────────────┐    ┌────────────────┐
│ @diffland/  │    │ @diffland/    │    │ @diffland/     │
│ ui (React)  │    │ tui (ink)     │    │ svg (SSR)      │
│ views/*     │    │ ASCII village │    │ static export  │
└─────────────┘    └───────────────┘    └────────────────┘
```

Dependency rule: **arrows only point inward.** `core` never imports from `ui`, `tui`, or `cli`. Renderers never call git. This is enforced by an eslint boundary rule and a CI check.

---

## 4. Repository layout (monorepo, pnpm + turborepo)

```
diffland/
├── .github/
│   ├── workflows/        # ci.yml, release.yml, benchmark.yml, codeql.yml
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── packages/
│   ├── core/             # PURE. No I/O. The brain.
│   │   ├── src/
│   │   │   ├── parser/           # diff text → structured records
│   │   │   ├── tree/             # records → RepoTree
│   │   │   ├── blast/            # blast score
│   │   │   ├── imports/          # import graph (pluggable per-language)
│   │   │   ├── providers/        # GitProvider, FsProvider interfaces
│   │   │   ├── schema/           # zod schemas + DiffLandData v1
│   │   │   └── index.ts
│   │   ├── tests/                # unit + golden-file tests
│   │   └── package.json
│   │
│   ├── git-node/         # GitProvider impl using child_process + simple-git
│   ├── git-iso/          # GitProvider impl using isomorphic-git (browser)
│   │
│   ├── cli/              # @diffland/cli — `npx diffland`
│   │   ├── src/
│   │   │   ├── index.ts          # commander entry
│   │   │   ├── server.ts         # fastify + ws, serves ui/dist
│   │   │   ├── watcher.ts        # chokidar → debounced re-parse
│   │   │   └── logger.ts         # pino
│   │   └── package.json
│   │
│   ├── ui/               # @diffland/ui — React views
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── views/            # VillageView, BlastView, OrbitView, …
│   │   │   ├── components/       # Tile, HUD, Tooltip, Legend
│   │   │   ├── hooks/
│   │   │   ├── theme/            # tokens.css — the design system
│   │   │   └── index.ts          # re-exports for embedders
│   │   ├── stories/              # Storybook
│   │   └── package.json
│   │
│   ├── tui/              # @diffland/tui — ink-based terminal village
│   ├── svg/              # @diffland/svg — server-side static export
│   └── sdk/              # @diffland/sdk — thin wrapper for programmatic use
│
├── apps/
│   ├── playground/       # Vite app, embeds ui/ against a demo repo in IndexedDB
│   ├── docs/             # Astro/Starlight docs site
│   └── vscode/           # VS Code extension (v0.3)
│
├── adapters/
│   ├── python/           # PyPI: `pipx run diffland` → shells to bundled node
│   ├── github-action/    # composite action for PR comments
│   └── rust/             # (v1.0) zero-dep TUI binary
│
├── fixtures/             # checked-in tiny + medium + large sample repos
├── benchmarks/           # runs against fixtures, writes to benchmark.json
├── docs/                 # ADRs live here (docs/adr/0001-*.md)
├── .changeset/           # changesets for release notes
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
└── README.md
```

### Why this shape
- **`core` is its own package** so Python/Rust adapters can stay thin and the browser playground can bundle it without pulling in `chokidar` or `fastify`.
- **`git-node` vs `git-iso`** decouples git from the core. Want to render a repo in the browser? Swap providers — no core changes.
- **`ui` is publishable** (`@diffland/ui`). VS Code extension, playground, and CLI all import it. There is exactly one place where a Tile is defined.
- **`apps/playground`** doubles as a live demo and the #1 contributor onramp — clone, `pnpm dev`, see the village on a fake repo with no git needed.
- **`fixtures/` + `benchmarks/`** make performance claims testable.

---

## 5. Data contract — `DiffLandData` v1

The single serializable artifact. Versioned. Validated with zod at the boundary. Anything that renders a view must accept this shape and nothing else.

```ts
// packages/core/src/schema/v1.ts

export const SCHEMA_VERSION = 1 as const;

export type ChangeType = 'modified' | 'added' | 'deleted' | 'renamed' | 'none';

export interface DiffNode {
  id:               string;        // stable hash of path
  name:             string;
  path:             string;        // repo-relative, POSIX separators
  type:             'file' | 'dir';
  ext:              string;
  changeType:       ChangeType;
  linesAdded:       number;
  linesDeleted:     number;
  netLines:         number;
  size:             number;        // bytes
  sizeRatio:        number;        // 0..1 relative to repo max
  daysSinceChange:  number | null; // null if never committed
  children?:        DiffNode[];
  imports?:         string[];      // repo-relative paths
}

export interface BlastScore {
  score:             number;       // 0..100
  dirsAffected:      number;
  filesChanged:      number;
  totalLinesChanged: number;
  label:             'focused' | 'moderate' | 'scattered' | 'chaos';
}

export interface DiffLandMeta {
  schemaVersion: typeof SCHEMA_VERSION;
  branch:        string;
  baseRef:       string;
  headRef:       string;
  repoName:      string;
  generatedAt:   number;           // unix ms
  diffland:      { version: string };
}

export interface DiffLandData {
  meta:        DiffLandMeta;
  tree:        DiffNode;           // root dir
  flatFiles:   DiffNode[];         // pre-flattened, render-ready
  blast:       BlastScore;
  importGraph: Record<string, string[]>;
}
```

**Rules:**
- Every field is required unless explicitly nullable. No optional chaos.
- Breaking change → bump `SCHEMA_VERSION` → major version of `@diffland/core`.
- Additive changes (new optional fields) are minor version bumps.
- `--json` output is exactly this shape. It is part of the public API.

---

## 6. Providers — how I/O stays out of core

```ts
// packages/core/src/providers/git.ts

export interface GitProvider {
  nameStatus(base: string, head: string): Promise<NameStatusRow[]>;
  numstat(base: string, head: string):    Promise<NumstatRow[]>;
  currentBranch():                        Promise<string>;
  resolveRef(ref: string):                Promise<string>;
  lastChangedAt(path: string):            Promise<number | null>;
  repoRoot():                             Promise<string>;
}

export interface FsProvider {
  readFile(path: string):  Promise<Uint8Array>;
  stat(path: string):      Promise<{ size: number }>;
  listFiles(glob: string): AsyncIterable<string>;
}
```

- `packages/git-node` implements these on top of `simple-git` + `fs/promises`.
- `packages/git-iso` implements them on top of `isomorphic-git` for the browser playground.
- Tests use an in-memory fake that loads fixtures from JSON.
- Core never imports `child_process`, `fs`, or `path` — enforced by eslint's `no-restricted-imports`.

---

## 7. UI architecture

- **Design tokens in one file** (`packages/ui/src/theme/tokens.css`) — every color from the UI spec below, exposed as CSS variables. Themes (light mode, high-contrast, colorblind-safe) are alternate token files.
- **Views are pure components** — they receive `DiffLandData` via context, no data fetching inside. This is what makes SSR (for the SVG package) and Storybook trivial.
- **State lives in a single `DiffLandProvider`** (`useDiffData()` hook) with WebSocket subscription in watch mode.
- **Storybook** per component + per view, with fixture data. Required for every new view PR.
- **Accessibility:** all interactive tiles are `<button>`s, keyboard-navigable grid (arrow keys), `prefers-reduced-motion` disables glow animations, tooltip content is also announced via `aria-describedby`.

---

## 8. UI design specification (village view)

The canonical UI is the **village view** — a dark-green grid of tiles representing every file and directory in the repository.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  HUD bar                                                            │
│  ● feature/auth-refactor  vs HEAD   ~4   +2   -1   [village] [blast]│
├─────────────────────────────────────────────────────────────────────┤
│  your repo — hover to inspect · click changed files to diff         │
├─────────────────────────────────────────────────────────────────────┤
│  GROUND (dark green background #0d1f07 / #1a3a0a)                   │
│                                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ src/ │ │ lib/ │ │tests/│ │docs/ │ │.env  │                       │
│  │ 📁   │ │ 📁   │ │ 📁   │ │ 📁   │ │ ⚙️   │                       │
│  │+108  │ │ -120 │ │ +20  │ │      │ │      │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                      │
│                                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐                                        │
│  │auth🔥│ │user🔥│ │router│                                         │
│  │ +24  │ │  +7  │ │      │                                         │
│  └──────┘ └──────┘ └──────┘                                        │
├─────────────────────────────────────────────────────────────────────┤
│  □ unchanged  🟧 🔥 modified  🟩 ✨ added  🟥 💀 deleted  🟨 hot dir│
└─────────────────────────────────────────────────────────────────────┘
```

### Color palette (design tokens)

| Token | Hex | Purpose |
|---|---|---|
| `--ground-bg` | `#0d1f07` | Page background |
| `--ground-container` | `#1a3a0a` | Tile grid container |
| `--tile-unchanged-file` | `#2e5e18` | Dormant file |
| `--tile-unchanged-dir` | `#345520` | Dormant dir |
| `--tile-modified` | `#7a4800` | Modified fill |
| `--tile-modified-border` | `#ffaa00` | Modified border |
| `--tile-added` | `#0a5a28` | Added fill |
| `--tile-added-border` | `#00dd66` | Added border |
| `--tile-deleted` | `#5a0a0a` | Deleted fill |
| `--tile-deleted-border` | `#ff4444` | Deleted border |
| `--tile-hotdir` | `#4a3800` | Hot dir fill |
| `--tile-hotdir-border` | `#aa7700` | Hot dir border |
| `--hud-branch-text` | `#7dfa6a` | Branch pill text |
| `--stat-modified` | `#ffcc66` | Modified count |
| `--stat-added` | `#7dfa6a` | Added count |
| `--stat-deleted` | `#ff8888` | Deleted count |
| `--net-badge-bg` | `#111` | Net badge bg |
| `--net-badge-text` | `#ffcc44` | Net badge text |

### Tile anatomy

Each tile is a square card with `aspect-ratio: 1`, `border-radius: 7px`, rendered in an 8-column CSS grid with `gap: 5px`.

```
┌──────────────────┐  ← border: 1.5px solid <change-color>
│  🔥              │  ← indicator emoji (modified only)
│   [icon 15px]    │  ← file type icon
│   filename       │  ← 8–9px monospace, truncated
│ ▓▓▓▓░░░░░░░░░░░ │  ← size bar: 3px bottom strip
└──────────────────┘
               [+42] ← net badge: absolute bottom-right
```

| State | Border | Background | Indicator | Animation |
|---|---|---|---|---|
| unchanged | `#224410` | `#2e5e18` | none | none |
| modified | `#ffaa00` | `#7a4800` | 🔥 | amber pulse 2s |
| added | `#00dd66` | `#0a5a28` | ✨ | green pulse 2s |
| deleted | `#ff4444` | `#5a0a0a` | 💀 | red pulse 2s |
| dir (hot) | `#aa7700` | `#4a3800` | — | static glow |
| dir (cold) | `#273f17` | `#345520` | — | none |

```css
@keyframes glow-mod {
  0%, 100% { box-shadow: 0 0 6px rgba(255,150,0,0.4); }
  50%      { box-shadow: 0 0 18px rgba(255,180,0,0.85),
                         inset 0 0 10px rgba(255,180,0,0.15); }
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

### Visual rules (must hold across all themes)

1. Ground is **dark green**, not black — reads as earth
2. Unchanged tiles recede; eye is drawn to glowing tiles
3. Modified = amber ("burning"), added = emerald ("growing"), deleted = red ("gone")
4. Hot directories glow *less* than files — they contain glow, they don't emit it
5. 8-column grid — the full repo visible at a glance
6. Hover lifts `scale(1.12) translateY(-2px)`
7. Glow pulses on 2s loop

---

## 9. Views

| View | Status | Purpose |
|---|---|---|
| **Village** | v0.1 | Canonical grid — the identity of diffland |
| **Blast radius** | v0.2 | Tiles scaled by lines changed + pulsing rings |
| **Orbit** | v0.4 | Circle-pack, directories as zones |
| **Import web** | v0.5 | Hover lights up import connections |
| **Change age** | v0.5 | Red→green spectrum by `daysSinceChange` |

**Blast score formula** (v0.2):
```
score = (dirsAffected / totalDirs)   * 40
      + (filesChanged / totalFiles)  * 40
      + min(totalLinesChanged / 500, 1) * 20
```
Labels: `0–25` focused · `26–50` moderate · `51–75` scattered · `76–100` chaos.

---

## 10. CLI interface

```
diffland [options]

  -b, --base <ref>       base ref to diff against          [default: HEAD]
  -H, --head <ref>       head ref                          [default: worktree]
  -p, --port <number>    local server port                 [default: 4343]
  -w, --watch            live-reload on file change
      --tui              terminal UI, no browser
      --json             print DiffLandData to stdout (stable API)
      --svg <path>       render static SVG and exit
      --view <name>      village | blast | orbit | imports | age
      --no-open          don't auto-open browser
      --ignore <glob>    exclude paths (repeatable; also reads .difflandignore)
      --max-files <n>    cap for huge repos                [default: 2000]
      --config <path>    explicit config file
  -v, --version
  -h, --help
```

### Config file — `.diffland.json` / `diffland` key in `package.json`

```json
{
  "base": "main",
  "ignore": ["dist/**", "**/*.snap"],
  "maxFiles": 2000,
  "view": "village",
  "theme": "default"
}
```

---

## 11. Open-source infrastructure (day-one checklist)

This is the stuff that makes the project survivable beyond its author. All of it ships before v0.1 tagging.

**Governance & community**
- [ ] `LICENSE` (MIT)
- [ ] `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1)
- [ ] `CONTRIBUTING.md` — dev setup in <5 min, PR expectations, commit style
- [ ] `SECURITY.md` — disclosure policy, contact
- [ ] `CODEOWNERS`
- [ ] Issue templates: bug, feature, view proposal
- [ ] PR template with screenshot requirement for UI changes
- [ ] `docs/adr/` — Architectural Decision Records (start with ADR-0001: "why monorepo", ADR-0002: "core is pure")

**Engineering hygiene**
- [ ] TypeScript strict mode, `noUncheckedIndexedAccess`
- [ ] ESLint + `@typescript-eslint` + boundary rule (core cannot import renderers)
- [ ] Prettier + EditorConfig
- [ ] Husky + lint-staged pre-commit
- [ ] Conventional commits enforced via commitlint
- [ ] Vitest for unit, Playwright for UI smoke, ink-testing-library for TUI
- [ ] `packages/core` test coverage gate ≥ 90%
- [ ] Storybook deployed to `storybook.diffland.dev` via Chromatic

**CI/CD (GitHub Actions)**
- [ ] `ci.yml` — lint, typecheck, test, build, on every PR
- [ ] `benchmark.yml` — run against fixtures, comment regressions on PR
- [ ] `release.yml` — changesets → auto npm publish + GitHub release + changelog
- [ ] `codeql.yml` — security scanning
- [ ] Dependabot weekly
- [ ] Matrix: Node 18, 20, 22 × ubuntu, macos, windows

**Release**
- [ ] Changesets for versioning (replaces manual `pnpm version`)
- [ ] Semantic-release style changelog auto-generated
- [ ] `next` tag on npm for pre-releases
- [ ] Provenance (`--provenance` flag) on publish

**Docs**
- [ ] `apps/docs` with Starlight
- [ ] Getting started, CLI reference, config reference, view gallery
- [ ] Embed playground in docs
- [ ] Architecture page links to ADRs
- [ ] Plugin authoring guide once plugin API stabilizes

---

## 12. Phased execution plan

Every phase is **independently shippable**. You can stop after any phase and still have a useful tool. Each phase ends with a git tag and an npm release.

### Phase 0 — Foundations (no product yet)
**Goal:** boring infrastructure so phase 1 feels effortless.
- Monorepo scaffold (pnpm + turborepo)
- TypeScript, eslint boundary rule, prettier, vitest, husky
- CI: lint + typecheck + test on PR
- `LICENSE`, `CODE_OF_CONDUCT`, `CONTRIBUTING`, `SECURITY`, issue/PR templates
- ADR-0001 (monorepo), ADR-0002 (pure core)
- `fixtures/` with a tiny sample repo (checked-in git history via `.gitbundle`)
- Empty `packages/core`, `packages/git-node`, `packages/cli`, `packages/ui` that build and pass "hello world" tests
- **Exit:** `pnpm install && pnpm build && pnpm test` works on a fresh clone in <5 min.

### Phase 1 — Core engine (`v0.1.0-alpha`)
**Goal:** `core` produces a valid `DiffLandData` from a real repo.
- `schema/v1.ts` with zod validators
- `GitProvider` / `FsProvider` interfaces + in-memory fake for tests
- `parser/` — parse `git diff --name-status` + `--numstat` output
- `tree/` — build `RepoTree`, compute `sizeRatio`, attach change info
- `blast/` — blast score
- `packages/git-node` — real implementation
- Golden-file tests against fixtures
- **Exit:** `import { analyze } from '@diffland/core'; console.log(await analyze({...}))` works end-to-end. 90% coverage on core.

### Phase 2 — CLI + JSON output (`v0.1.0`)
**Goal:** a useful tool that writes to stdout.
- `packages/cli` with commander + pino
- `diffland --json` writes valid `DiffLandData` to stdout
- `.difflandignore` + config file loader
- `--max-files` cap with clear error
- README with `npx diffland --json | jq .blast` demo
- First npm publish: `diffland`, `@diffland/core`, `@diffland/git-node`
- **Exit:** anyone can `npx diffland --json` in any git repo on the planet and get back valid JSON.

### Phase 3 — Village view (`v0.2.0`) — **the moment diffland is diffland**
**Goal:** the canonical UI, matching the design spec exactly.
- `packages/ui` with React + Vite
- `theme/tokens.css` — every color from §8
- `VillageView`, `Tile`, `HUD`, `Tooltip`, `Legend`
- Storybook with fixture-driven stories
- `packages/cli/server.ts` — fastify + ws, serves `ui/dist`
- `apps/playground` — Vite app running `ui` against fixture data (no git!)
- Playwright smoke test: load playground, assert tile count + classes
- README gets animated GIF
- **Exit:** `npx diffland` opens a browser and shows your diff as a village.

### Phase 4 — Watch mode + Blast view (`v0.3.0`)
- `chokidar` watcher with 100ms debounce
- WebSocket push of new `DiffLandData` on change
- Re-render perf budget: <100ms on fixture medium repo
- `BlastView` with scaled tiles + pulsing rings + score label
- Benchmark workflow live; regressions comment on PRs
- **Exit:** `diffland --watch` live-reloads as Claude Code edits files.

### Phase 5 — TUI + SVG export (`v0.4.0`)
- `packages/tui` with ink — ASCII village, arrow-key nav
- `packages/svg` — SSR village view to static SVG (for PR comments)
- `diffland --tui` and `diffland --svg out.svg`
- **Exit:** diffland works without a browser.

### Phase 6 — Remaining views + plugin API (`v0.5.0`)
- `OrbitView`, `ImportWebView`, `AgeView`
- `imports/` language-pluggable (start with TS/JS via `@babel/parser`, Python via `tree-sitter-python`)
- Freeze the `View` plugin interface (`(data: DiffLandData) => ReactNode` + metadata)
- Docs: "How to write a view"
- **Exit:** a contributor can publish `@someone/diffland-view-foo` and load it via config.

### Phase 7 — Ecosystem (`v1.0.0`)
- `apps/vscode` — WebView panel, same `ui` package
- `adapters/github-action` — PR-comment SVG via `packages/svg`
- `adapters/python` — PyPI wheel bundling the node binary via `node-binary`
- Docs site live at `diffland.dev`
- Changesets automated release pipeline
- Announce: HN, Reddit r/programming, Twitter
- **Exit:** a Python user can `pipx run diffland`, a VS Code user can open a WebView, every PR on GitHub repos using the action gets a village screenshot.

### Phase 8 — Power features (post-1.0)
- Commit history scrubber (step through commits, watch village change)
- Author view (color tiles by `git blame`)
- LLM summary overlay ("these 8 files are the auth refactor")
- `adapters/rust` — zero-dep native TUI binary
- Remote repo mode (clone to tmp, render, delete)

---

## 13. Performance budgets (enforced in CI)

| Metric | Target | Fixture |
|---|---|---|
| `analyze()` cold | <500ms | medium (2k files) |
| First browser paint | <1s | medium |
| Re-render on watch event | <100ms | medium |
| `analyze()` cold | <5s | large (20k files) |
| Memory peak | <300MB | large |

`benchmarks/` runs these against checked-in fixture repos on every PR. A regression >15% blocks merge unless explicitly waived with `perf-waiver` label + justification in PR body.

---

## 14. Security

- `SECURITY.md` with disclosure email + 90-day policy
- CodeQL on every push
- `npm audit` gate in CI (blocks `high` and above)
- CLI never executes arbitrary shell — all git invocations go through `simple-git` with typed args
- Config files are parsed with zod; no `eval`, no dynamic `require`
- `--json` output is sanitized: no absolute paths leaked (repo-relative only)
- Dependency policy: no package with <3 maintainers *or* <1k weekly downloads without an ADR

---

## 15. Inspiration and differentiation

| Project | What we borrowed | What we did differently |
|---|---|---|
| GitHub Next: Repo Visualization | Circle-pack, import connections | Real-time diff overlay; grid is primary; current diff not history |
| Git-Heat-Map | Treemap + heatmap concept | Working tree not history; CoC visual; multi-view |
| Gource | Living repo visualization | Spatial not temporal; instant not animated; CLI-first |
| Clash of Clans | Village/ground metaphor | Tiles = files; dark green earth not grass |

---

## 16. License

MIT — see [LICENSE](./LICENSE).

## 17. Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). If you port diffland to a new language or build an editor plugin, open an issue — the goal is for `diffland` to be the universal name across all ecosystems.

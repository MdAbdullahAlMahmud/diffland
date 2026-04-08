/**
 * analyze() — the public entry point of @diffland/core.
 *
 * Takes providers + config, returns a validated DiffLandData. No I/O
 * happens here directly; everything flows through the injected providers.
 */
import type { FsProvider, GitProvider } from './providers/index.js';
import { SCHEMA_VERSION, diffLandDataSchema, type DiffLandData } from './schema/v1.js';
import { parseNameStatus } from './parser/nameStatus.js';
import { parseNumstat } from './parser/numstat.js';
import { buildTree, type FileRecord } from './tree/build.js';
import { computeBlastScore } from './blast/score.js';
import { CORE_VERSION } from './version.js';

export interface AnalyzeOptions {
  git: GitProvider;
  fs: FsProvider;
  /** Base ref to diff against. Default: HEAD. */
  base?: string;
  /** Head ref. Default: the working tree (empty string for worktree). */
  head?: string;
  /** Glob patterns to ignore when listing files. */
  ignore?: readonly string[];
  /** Max number of files to include; repos bigger than this get truncated. */
  maxFiles?: number;
  /**
   * Override "now" for deterministic tests. Unix seconds.
   */
  now?: number;
}

const DEFAULT_MAX_FILES = 2000;

/**
 * Some providers return pre-parsed rows (typed), others return raw strings
 * from stdout. We accept either by normalizing here.
 */
function normalizeNameStatus(
  value: Awaited<ReturnType<GitProvider['nameStatus']>>,
): ReturnType<typeof parseNameStatus> {
  if (typeof value === 'string') return parseNameStatus(value);
  return value;
}
function normalizeNumstat(
  value: Awaited<ReturnType<GitProvider['numstat']>>,
): ReturnType<typeof parseNumstat> {
  if (typeof value === 'string') return parseNumstat(value);
  return value;
}

export async function analyze(options: AnalyzeOptions): Promise<DiffLandData> {
  const {
    git,
    fs,
    base = 'HEAD',
    head = '',
    ignore = [],
    maxFiles = DEFAULT_MAX_FILES,
    now = Math.floor(Date.now() / 1000),
  } = options;

  const [branch, repoName, nameStatusRaw, numstatRaw] = await Promise.all([
    git.currentBranch(),
    git.repoName(),
    git.nameStatus(base, head),
    git.numstat(base, head),
  ]);

  const nameStatus = normalizeNameStatus(nameStatusRaw);
  const numstat = normalizeNumstat(numstatRaw);

  // Collect files, capped to maxFiles. listFiles is an async iterable so
  // huge repos don't blow memory.
  const files: FileRecord[] = [];
  let truncated = false;
  for await (const path of fs.listFiles({ ignore })) {
    if (files.length >= maxFiles) {
      truncated = true;
      break;
    }
    const st = await fs.stat(path);
    if (!st.isFile) continue;
    const lastChangedAt = await git.lastChangedAt(path);
    files.push({ path, size: st.size, lastChangedAt });
  }

  if (truncated) {
    // Surface via a sentinel error field? For now, we just clamp silently;
    // the CLI layer (Phase 2) will warn.
  }

  const { tree, flatFiles } = buildTree({
    files,
    nameStatus,
    numstat,
    now,
  });

  const blast = computeBlastScore({ tree, flatFiles });

  const data: DiffLandData = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      branch,
      baseRef: base,
      headRef: head,
      repoName,
      generatedAt: Date.now(),
      diffland: { version: CORE_VERSION },
    },
    tree,
    flatFiles,
    blast,
    importGraph: {},
  };

  // Belt + suspenders: validate at the boundary.
  return diffLandDataSchema.parse(data);
}

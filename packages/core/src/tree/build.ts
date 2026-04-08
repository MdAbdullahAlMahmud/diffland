/**
 * Build a RepoTree from a list of file records, then annotate it with diff
 * information from the parser. Pure function, fully synchronous.
 */
import type { ChangeType, DiffNode } from '../schema/v1.js';
import type { NameStatusRow, NumstatRow } from '../providers/git.js';
import { basename, dirname, extname, splitSegments, stableHash } from '../util/path.js';

export interface FileRecord {
  /** Repo-relative POSIX path. */
  path: string;
  /** Size in bytes. */
  size: number;
  /** Unix seconds; null if untracked/unknown. */
  lastChangedAt?: number | null;
}

export interface BuildTreeInput {
  files: readonly FileRecord[];
  nameStatus: readonly NameStatusRow[];
  numstat: readonly NumstatRow[];
  /** Unix seconds — "now" reference for daysSinceChange. */
  now: number;
}

export interface BuildTreeOutput {
  tree: DiffNode;
  flatFiles: DiffNode[];
}

const STATUS_TO_CHANGE: Record<string, ChangeType> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'added',
  T: 'modified',
  U: 'modified',
};

interface DiffInfo {
  changeType: ChangeType;
  linesAdded: number;
  linesDeleted: number;
}

function buildDiffIndex(
  nameStatus: readonly NameStatusRow[],
  numstat: readonly NumstatRow[],
): Map<string, DiffInfo> {
  const byPath = new Map<string, DiffInfo>();

  for (const row of nameStatus) {
    const change = STATUS_TO_CHANGE[row.status] ?? 'modified';
    byPath.set(row.path, { changeType: change, linesAdded: 0, linesDeleted: 0 });
  }

  for (const row of numstat) {
    const existing = byPath.get(row.path) ?? {
      changeType: 'modified' as ChangeType,
      linesAdded: 0,
      linesDeleted: 0,
    };
    existing.linesAdded = row.linesAdded ?? 0;
    existing.linesDeleted = row.linesDeleted ?? 0;
    byPath.set(row.path, existing);
  }

  return byPath;
}

function daysSince(now: number, then: number | null | undefined): number | null {
  if (then == null) return null;
  const diffSec = Math.max(0, now - then);
  return Math.floor(diffSec / 86_400);
}

function makeFileNode(
  file: FileRecord,
  diff: DiffInfo | undefined,
  maxSize: number,
  now: number,
): DiffNode {
  const change = diff?.changeType ?? 'none';
  const linesAdded = diff?.linesAdded ?? 0;
  const linesDeleted = diff?.linesDeleted ?? 0;
  const sizeRatio = maxSize > 0 ? file.size / maxSize : 0;

  return {
    id: stableHash(file.path),
    name: basename(file.path),
    path: file.path,
    type: 'file',
    ext: extname(file.path),
    changeType: change,
    linesAdded,
    linesDeleted,
    netLines: linesAdded - linesDeleted,
    size: file.size,
    sizeRatio,
    daysSinceChange: daysSince(now, file.lastChangedAt),
  };
}

function makeDirNode(path: string): DiffNode {
  const name = path === '' ? '' : basename(path);
  return {
    id: stableHash(`dir:${path}`),
    name,
    path,
    type: 'dir',
    ext: '',
    changeType: 'none',
    linesAdded: 0,
    linesDeleted: 0,
    netLines: 0,
    size: 0,
    sizeRatio: 0,
    daysSinceChange: null,
    children: [],
  };
}

/**
 * Bubble up aggregates: dir size = sum of children sizes; dir line stats =
 * sum of descendants; dir changeType = 'modified' if any descendant changed.
 */
function rollup(node: DiffNode): void {
  if (node.type !== 'dir' || !node.children) return;
  let size = 0;
  let linesAdded = 0;
  let linesDeleted = 0;
  let anyChanged = false;

  for (const child of node.children) {
    rollup(child);
    size += child.size;
    linesAdded += child.linesAdded;
    linesDeleted += child.linesDeleted;
    if (child.changeType !== 'none') anyChanged = true;
  }

  node.size = size;
  node.linesAdded = linesAdded;
  node.linesDeleted = linesDeleted;
  node.netLines = linesAdded - linesDeleted;
  node.changeType = anyChanged ? 'modified' : 'none';
}

export function buildTree(input: BuildTreeInput): BuildTreeOutput {
  const diffIndex = buildDiffIndex(input.nameStatus, input.numstat);

  // Ensure deleted paths still appear as tombstone file nodes even though
  // they're not in the working tree's file list.
  const knownPaths = new Set(input.files.map((f) => f.path));
  const phantomFiles: FileRecord[] = [];
  for (const [path, info] of diffIndex) {
    if (info.changeType === 'deleted' && !knownPaths.has(path)) {
      phantomFiles.push({ path, size: 0, lastChangedAt: null });
    }
  }
  const allFiles = [...input.files, ...phantomFiles];

  const maxSize = allFiles.reduce((m, f) => (f.size > m ? f.size : m), 0);

  const root = makeDirNode('');
  const dirIndex = new Map<string, DiffNode>();
  dirIndex.set('', root);

  function ensureDir(dirPath: string): DiffNode {
    const cached = dirIndex.get(dirPath);
    if (cached) return cached;
    const node = makeDirNode(dirPath);
    dirIndex.set(dirPath, node);
    const parent = ensureDir(dirname(dirPath));
    parent.children!.push(node);
    return node;
  }

  const flatFiles: DiffNode[] = [];

  // Deterministic order for stable tests.
  const sorted = [...allFiles].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const segments = splitSegments(file.path);
    if (segments.length === 0) continue;
    const parentPath = dirname(file.path);
    const parent = ensureDir(parentPath);
    const node = makeFileNode(file, diffIndex.get(file.path), maxSize, input.now);
    parent.children!.push(node);
    flatFiles.push(node);
  }

  rollup(root);
  return { tree: root, flatFiles };
}

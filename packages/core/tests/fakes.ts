/**
 * In-memory fake GitProvider / FsProvider for unit tests.
 * Core tests must never touch real git or real disk.
 */
import type {
  FsProvider,
  FsStat,
  GitProvider,
  NameStatusRow,
  NumstatRow,
} from '../src/providers/index.js';

export interface FakeFile {
  path: string;
  size: number;
  lastChangedAt?: number | null;
}

export interface FakeRepoInit {
  branch?: string;
  repoName?: string;
  files?: readonly FakeFile[];
  nameStatus?: readonly NameStatusRow[];
  numstat?: readonly NumstatRow[];
}

export function makeFakeGit(init: FakeRepoInit): GitProvider {
  const files = init.files ?? [];
  const lastChanged = new Map(files.map((f) => [f.path, f.lastChangedAt ?? null]));
  return {
    nameStatus: async () => [...(init.nameStatus ?? [])],
    numstat: async () => [...(init.numstat ?? [])],
    currentBranch: async () => init.branch ?? 'main',
    resolveRef: async (ref) => ref,
    lastChangedAt: async (path) => lastChanged.get(path) ?? null,
    repoRoot: async () => '/fake',
    repoName: async () => init.repoName ?? 'fake-repo',
  };
}

export function makeFakeFs(init: FakeRepoInit): FsProvider {
  const files = init.files ?? [];
  const byPath = new Map(files.map((f) => [f.path, f]));
  return {
    async stat(path: string): Promise<FsStat> {
      const f = byPath.get(path);
      if (!f) return { size: 0, isFile: false, isDirectory: false };
      return { size: f.size, isFile: true, isDirectory: false };
    },
    async *listFiles() {
      for (const f of files) yield f.path;
    },
    async readFile() {
      return new Uint8Array();
    },
  };
}

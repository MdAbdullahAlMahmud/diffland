/**
 * GitProvider — the only way core touches git.
 *
 * Implementations live in @diffland/git-node (Node via simple-git) and
 * @diffland/git-iso (browser via isomorphic-git, Phase 3+). Tests use an
 * in-memory fake.
 */

export type NameStatusCode = 'M' | 'A' | 'D' | 'R' | 'C' | 'T' | 'U';

export interface NameStatusRow {
  status: NameStatusCode;
  path: string;
  /** Original path for renames/copies. */
  oldPath?: string;
  /** Similarity score 0..100 for R/C entries. */
  score?: number;
}

export interface NumstatRow {
  /** null = binary file. */
  linesAdded: number | null;
  linesDeleted: number | null;
  path: string;
  oldPath?: string;
}

export interface GitProvider {
  nameStatus(base: string, head: string): Promise<NameStatusRow[]>;
  numstat(base: string, head: string): Promise<NumstatRow[]>;
  currentBranch(): Promise<string>;
  resolveRef(ref: string): Promise<string>;
  /** Unix seconds of last commit touching path, or null if untracked. */
  lastChangedAt(path: string): Promise<number | null>;
  repoRoot(): Promise<string>;
  repoName(): Promise<string>;
}

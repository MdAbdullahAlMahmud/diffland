/**
 * Node GitProvider — this is one of the only places `child_process` and
 * filesystem reads are allowed (via simple-git).
 */
import { simpleGit, type SimpleGit } from 'simple-git';
import * as path from 'node:path';
import type { GitProvider, NameStatusRow, NumstatRow } from '@diffland/core';
import { parseNameStatus, parseNumstat } from '@diffland/core';

export interface NodeGitOptions {
  /** Repo root. Defaults to process.cwd(). */
  cwd?: string;
}

export function createNodeGitProvider(options: NodeGitOptions = {}): GitProvider {
  const cwd = options.cwd ?? process.cwd();
  const git: SimpleGit = simpleGit({ baseDir: cwd });

  async function diffArgs(base: string, head: string, extra: readonly string[]): Promise<string[]> {
    const args = ['diff', ...extra, base];
    if (head !== '' && head !== 'worktree') args.push(head);
    return args;
  }

  return {
    async nameStatus(base, head): Promise<NameStatusRow[]> {
      const args = await diffArgs(base, head, ['--name-status', '-M']);
      const out = await git.raw(args);
      return parseNameStatus(out);
    },

    async numstat(base, head): Promise<NumstatRow[]> {
      const args = await diffArgs(base, head, ['--numstat']);
      const out = await git.raw(args);
      return parseNumstat(out);
    },

    async currentBranch() {
      try {
        const res = await git.raw(['rev-parse', '--abbrev-ref', 'HEAD']);
        return res.trim() || 'HEAD';
      } catch {
        return 'HEAD';
      }
    },

    async resolveRef(ref) {
      const res = await git.raw(['rev-parse', ref]);
      return res.trim();
    },

    async lastChangedAt(relPath: string): Promise<number | null> {
      try {
        const res = await git.raw(['log', '-1', '--format=%ct', '--', relPath]);
        const trimmed = res.trim();
        if (!trimmed) return null;
        const n = Number.parseInt(trimmed, 10);
        return Number.isNaN(n) ? null : n;
      } catch {
        return null;
      }
    },

    async repoRoot() {
      const res = await git.raw(['rev-parse', '--show-toplevel']);
      return res.trim();
    },

    async repoName() {
      const root = await this.repoRoot();
      return path.basename(root);
    },
  } satisfies GitProvider;
}

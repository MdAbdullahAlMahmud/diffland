/**
 * Node FsProvider — fast-glob + fs/promises.
 */
import * as nodeFs from 'node:fs/promises';
import * as path from 'node:path';
import fastGlob from 'fast-glob';
import type { FsProvider, FsStat } from '@diffland/core';

export interface NodeFsOptions {
  cwd: string;
  /** Patterns always excluded even if the caller doesn't pass them. */
  defaultIgnore?: readonly string[];
}

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.turbo/**',
  '**/coverage/**',
];

export function createNodeFsProvider(options: NodeFsOptions): FsProvider {
  const { cwd, defaultIgnore = DEFAULT_IGNORE } = options;

  return {
    async stat(relPath: string): Promise<FsStat> {
      const abs = path.join(cwd, relPath);
      const st = await nodeFs.stat(abs);
      return {
        size: st.size,
        isFile: st.isFile(),
        isDirectory: st.isDirectory(),
      };
    },

    async *listFiles({ ignore = [] } = {}) {
      const stream = fastGlob.stream(['**/*'], {
        cwd,
        dot: false,
        onlyFiles: true,
        followSymbolicLinks: false,
        ignore: [...defaultIgnore, ...ignore],
      });
      for await (const entry of stream) {
        yield entry.toString().replace(/\\/g, '/');
      }
    },

    async readFile(relPath: string): Promise<Uint8Array> {
      const abs = path.join(cwd, relPath);
      return nodeFs.readFile(abs);
    },
  };
}

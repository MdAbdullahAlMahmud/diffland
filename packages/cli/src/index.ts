#!/usr/bin/env node
/**
 * diffland CLI — Phase 1 stub.
 *
 * Real commander wiring + --json output lands in Phase 2. For now we just
 * prove the package links against @diffland/core and @diffland/git-node.
 */
import { CORE_VERSION, analyze } from '@diffland/core';
import { createNodeGitProvider, createNodeFsProvider } from '@diffland/git-node';

export async function main(cwd: string = process.cwd()): Promise<string> {
  const data = await analyze({
    git: createNodeGitProvider({ cwd }),
    fs: createNodeFsProvider({ cwd }),
  });
  return JSON.stringify({ coreVersion: CORE_VERSION, blast: data.blast }, null, 2);
}

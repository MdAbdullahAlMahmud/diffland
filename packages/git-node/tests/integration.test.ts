/**
 * Integration test: real git repo in a temp dir.
 *
 * This is the only place in the repo where tests touch real git. It
 * exercises the full pipeline: Node providers → @diffland/core.analyze()
 * → schema-valid DiffLandData.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { simpleGit } from 'simple-git';
import { analyze, diffLandDataSchema } from '@diffland/core';
import { createNodeGitProvider, createNodeFsProvider } from '../src/index.js';

let tmp: string;

async function setupRepo(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'diffland-test-'));
  const git = simpleGit({ baseDir: dir });
  await git.init();
  await git.addConfig('user.email', 'test@diffland.dev');
  await git.addConfig('user.name', 'Test');
  await git.raw(['checkout', '-b', 'main']);

  await fs.mkdir(path.join(dir, 'src'), { recursive: true });
  await fs.writeFile(path.join(dir, 'src/auth.ts'), 'line1\nline2\nline3\n');
  await fs.writeFile(path.join(dir, 'README.md'), '# hi\n');
  await git.add('.');
  await git.commit('initial');

  // Make changes vs HEAD
  await fs.writeFile(path.join(dir, 'src/auth.ts'), 'line1\nline2\nline3\nadded\nadded2\n');
  await fs.writeFile(path.join(dir, 'src/user.ts'), 'new file\n');

  return dir;
}

describe('@diffland/git-node integration', () => {
  beforeAll(async () => {
    tmp = await setupRepo();
  });

  afterAll(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('analyze() on a real repo returns valid DiffLandData', async () => {
    // Need to stage+write the new file so diff --name-status sees it
    const git = simpleGit({ baseDir: tmp });
    await git.add('src/user.ts');

    const data = await analyze({
      git: createNodeGitProvider({ cwd: tmp }),
      fs: createNodeFsProvider({ cwd: tmp }),
      base: 'HEAD',
    });

    expect(() => diffLandDataSchema.parse(data)).not.toThrow();
    expect(data.meta.branch).toBe('main');
    expect(data.flatFiles.length).toBeGreaterThanOrEqual(3);

    const auth = data.flatFiles.find((f) => f.path === 'src/auth.ts');
    expect(auth?.changeType).toBe('modified');
    expect(auth?.linesAdded).toBeGreaterThanOrEqual(2);
  });
});

import { describe, it, expect } from 'vitest';
import { analyze, diffLandDataSchema, SCHEMA_VERSION } from '../src/index.js';
import { makeFakeGit, makeFakeFs } from './fakes.js';

describe('analyze', () => {
  it('produces a schema-valid DiffLandData from fake providers', async () => {
    const init = {
      branch: 'feature/x',
      repoName: 'fake',
      files: [
        { path: 'src/auth.ts', size: 1000, lastChangedAt: 1_699_000_000 },
        { path: 'src/user.ts', size: 400, lastChangedAt: 1_690_000_000 },
        { path: 'README.md', size: 100, lastChangedAt: 1_699_900_000 },
      ],
      nameStatus: [
        { status: 'M' as const, path: 'src/auth.ts' },
        { status: 'A' as const, path: 'src/user.ts' },
      ],
      numstat: [
        { linesAdded: 10, linesDeleted: 2, path: 'src/auth.ts' },
        { linesAdded: 50, linesDeleted: 0, path: 'src/user.ts' },
      ],
    };

    const data = await analyze({
      git: makeFakeGit(init),
      fs: makeFakeFs(init),
      now: 1_700_000_000,
    });

    // Schema passes
    expect(() => diffLandDataSchema.parse(data)).not.toThrow();
    expect(data.meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(data.meta.branch).toBe('feature/x');
    expect(data.meta.repoName).toBe('fake');
    expect(data.flatFiles.length).toBe(3);
    expect(data.blast.filesChanged).toBe(2);
    expect(data.blast.totalLinesChanged).toBe(62);
  });

  it('respects maxFiles', async () => {
    const files = Array.from({ length: 50 }, (_, i) => ({
      path: `f${i}.ts`,
      size: 1,
    }));
    const init = { files, nameStatus: [], numstat: [] };
    const data = await analyze({
      git: makeFakeGit(init),
      fs: makeFakeFs(init),
      maxFiles: 10,
      now: 1_700_000_000,
    });
    expect(data.flatFiles.length).toBe(10);
  });
});

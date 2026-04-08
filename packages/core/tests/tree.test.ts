import { describe, it, expect } from 'vitest';
import { buildTree } from '../src/tree/build.js';

const NOW = 1_700_000_000; // fixed "now" so daysSinceChange is deterministic

describe('buildTree', () => {
  it('builds a nested directory tree with rolled-up stats', () => {
    const { tree, flatFiles } = buildTree({
      now: NOW,
      files: [
        { path: 'src/auth.ts', size: 1000, lastChangedAt: NOW - 86_400 * 3 },
        { path: 'src/user.ts', size: 500, lastChangedAt: NOW - 86_400 * 10 },
        { path: 'README.md', size: 200, lastChangedAt: NOW - 86_400 },
      ],
      nameStatus: [
        { status: 'M', path: 'src/auth.ts' },
        { status: 'A', path: 'src/user.ts' },
      ],
      numstat: [
        { linesAdded: 24, linesDeleted: 6, path: 'src/auth.ts' },
        { linesAdded: 42, linesDeleted: 0, path: 'src/user.ts' },
      ],
    });

    expect(tree.type).toBe('dir');
    expect(tree.children?.length).toBe(2); // src/ and README.md

    const src = tree.children!.find((c) => c.path === 'src')!;
    expect(src.type).toBe('dir');
    expect(src.children?.length).toBe(2);
    expect(src.size).toBe(1500);
    expect(src.linesAdded).toBe(66);
    expect(src.linesDeleted).toBe(6);
    expect(src.netLines).toBe(60);
    expect(src.changeType).toBe('modified');

    const auth = flatFiles.find((f) => f.path === 'src/auth.ts')!;
    expect(auth.changeType).toBe('modified');
    expect(auth.netLines).toBe(18);
    expect(auth.daysSinceChange).toBe(3);
    expect(auth.sizeRatio).toBe(1); // largest file
    expect(auth.ext).toBe('ts');

    const readme = flatFiles.find((f) => f.path === 'README.md')!;
    expect(readme.changeType).toBe('none');
    expect(readme.sizeRatio).toBeCloseTo(0.2);
  });

  it('creates tombstone nodes for deleted files not in the working tree', () => {
    const { flatFiles } = buildTree({
      now: NOW,
      files: [{ path: 'keep.ts', size: 10 }],
      nameStatus: [{ status: 'D', path: 'gone.ts' }],
      numstat: [{ linesAdded: 0, linesDeleted: 50, path: 'gone.ts' }],
    });

    const gone = flatFiles.find((f) => f.path === 'gone.ts');
    expect(gone).toBeDefined();
    expect(gone?.changeType).toBe('deleted');
    expect(gone?.linesDeleted).toBe(50);
    expect(gone?.size).toBe(0);
  });

  it('produces stable ids via path hashing', () => {
    const { flatFiles: a } = buildTree({
      now: NOW,
      files: [{ path: 'x.ts', size: 1 }],
      nameStatus: [],
      numstat: [],
    });
    const { flatFiles: b } = buildTree({
      now: NOW,
      files: [{ path: 'x.ts', size: 1 }],
      nameStatus: [],
      numstat: [],
    });
    expect(a[0]?.id).toBe(b[0]?.id);
  });
});

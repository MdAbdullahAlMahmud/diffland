import { describe, it, expect } from 'vitest';
import { buildTree } from '../src/tree/build.js';
import { computeBlastScore } from '../src/blast/score.js';

const NOW = 1_700_000_000;

function scoreFor(
  files: Array<{ path: string; size: number }>,
  nameStatus: Array<{ status: 'M' | 'A' | 'D'; path: string }>,
  numstat: Array<{ linesAdded: number; linesDeleted: number; path: string }>,
) {
  const { tree, flatFiles } = buildTree({ now: NOW, files, nameStatus, numstat });
  return computeBlastScore({ tree, flatFiles });
}

describe('computeBlastScore', () => {
  it('returns 0 for an unchanged repo', () => {
    const s = scoreFor(
      [
        { path: 'src/a.ts', size: 1 },
        { path: 'src/b.ts', size: 1 },
      ],
      [],
      [],
    );
    expect(s.score).toBe(0);
    expect(s.label).toBe('focused');
    expect(s.filesChanged).toBe(0);
  });

  it('classifies a small focused change as focused', () => {
    // 20 files across 10 dirs; change 1 file in 1 dir → ~4 + ~2 + tiny line ratio
    const files = Array.from({ length: 20 }, (_, i) => ({
      path: `dir${Math.floor(i / 2)}/file${i}.ts`,
      size: 1,
    }));
    const s = scoreFor(
      files,
      [{ status: 'M', path: 'dir0/file0.ts' }],
      [{ linesAdded: 3, linesDeleted: 1, path: 'dir0/file0.ts' }],
    );
    expect(s.label).toBe('focused');
    expect(s.filesChanged).toBe(1);
    expect(s.totalLinesChanged).toBe(4);
  });

  it('classifies a sprawling change as scattered or chaos', () => {
    const files = [
      { path: 'a/1.ts', size: 1 },
      { path: 'b/1.ts', size: 1 },
      { path: 'c/1.ts', size: 1 },
      { path: 'd/1.ts', size: 1 },
    ];
    const s = scoreFor(
      files,
      files.map((f) => ({ status: 'M' as const, path: f.path })),
      files.map((f) => ({ linesAdded: 200, linesDeleted: 0, path: f.path })),
    );
    expect(s.score).toBeGreaterThanOrEqual(75);
    expect(['scattered', 'chaos']).toContain(s.label);
  });
});

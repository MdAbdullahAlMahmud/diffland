import { describe, it, expect } from 'vitest';
import { parseNameStatus, parseNumstat } from '../src/parser/index.js';

describe('parseNameStatus', () => {
  it('parses simple M/A/D rows', () => {
    const rows = parseNameStatus('M\tsrc/auth.ts\nA\tsrc/new.ts\nD\tsrc/old.ts\n');
    expect(rows).toEqual([
      { status: 'M', path: 'src/auth.ts' },
      { status: 'A', path: 'src/new.ts' },
      { status: 'D', path: 'src/old.ts' },
    ]);
  });

  it('parses renames with similarity score', () => {
    const rows = parseNameStatus('R100\tsrc/a.ts\tsrc/b.ts\n');
    expect(rows).toEqual([{ status: 'R', oldPath: 'src/a.ts', path: 'src/b.ts', score: 100 }]);
  });

  it('ignores unknown status codes', () => {
    const rows = parseNameStatus('X\tsrc/weird.ts\nM\tok.ts\n');
    expect(rows).toEqual([{ status: 'M', path: 'ok.ts' }]);
  });

  it('handles empty input', () => {
    expect(parseNameStatus('')).toEqual([]);
  });

  it('accepts CRLF', () => {
    expect(parseNameStatus('M\tx.ts\r\nA\ty.ts\r\n').length).toBe(2);
  });
});

describe('parseNumstat', () => {
  it('parses line counts', () => {
    const rows = parseNumstat('24\t18\tsrc/auth.ts\n42\t0\tsrc/new.ts\n');
    expect(rows).toEqual([
      { linesAdded: 24, linesDeleted: 18, path: 'src/auth.ts' },
      { linesAdded: 42, linesDeleted: 0, path: 'src/new.ts' },
    ]);
  });

  it('marks binary files with null counts', () => {
    const rows = parseNumstat('-\t-\tassets/logo.png\n');
    expect(rows).toEqual([{ linesAdded: null, linesDeleted: null, path: 'assets/logo.png' }]);
  });

  it('handles paths containing tabs in the path column', () => {
    const rows = parseNumstat('1\t2\tsrc/weird\tname.ts\n');
    expect(rows[0]?.path).toBe('src/weird\tname.ts');
  });

  it('empty input returns []', () => {
    expect(parseNumstat('')).toEqual([]);
  });
});

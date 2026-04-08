/**
 * Parse `git diff --name-status -z` output.
 *
 * The `-z` form uses NUL as the record separator and NUL as the field
 * separator inside a record, which avoids any ambiguity with paths that
 * contain tabs or newlines. We accept both NUL-delimited and tab-delimited
 * input (the latter is easier to hand-write in tests).
 *
 * Lines look like:
 *   M\tsrc/auth.ts
 *   A\tsrc/new.ts
 *   D\tsrc/old.ts
 *   R100\tsrc/a.ts\tsrc/b.ts
 */
import type { NameStatusRow, NameStatusCode } from '../providers/git.js';

const VALID_STATUS = new Set<NameStatusCode>(['M', 'A', 'D', 'R', 'C', 'T', 'U']);

export function parseNameStatus(input: string): NameStatusRow[] {
  if (input.length === 0) return [];
  const normalized = input.replace(/\r\n/g, '\n').replace(/\0/g, '\n');
  const rows: NameStatusRow[] = [];

  const lines = normalized.split('\n').filter((l) => l.length > 0);
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const rawStatus = parts[0] ?? '';
    const code = rawStatus.charAt(0) as NameStatusCode;
    if (!VALID_STATUS.has(code)) continue;

    const score = rawStatus.length > 1 ? Number.parseInt(rawStatus.slice(1), 10) : undefined;

    if ((code === 'R' || code === 'C') && parts.length >= 3) {
      const row: NameStatusRow = {
        status: code,
        oldPath: parts[1] ?? '',
        path: parts[2] ?? '',
      };
      if (score !== undefined && !Number.isNaN(score)) row.score = score;
      rows.push(row);
      continue;
    }

    rows.push({ status: code, path: parts[1] ?? '' });
  }

  return rows;
}

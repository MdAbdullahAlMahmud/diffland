/**
 * Parse `git diff --numstat` output.
 *
 * Lines:
 *   24\t18\tsrc/auth.ts
 *   42\t0\tsrc/new.ts
 *   -\t-\tbinary/file.png        (binary — null added/deleted)
 *   3\t1\tsrc/{old => new}/x.ts  (rename shorthand — we ignore here, real
 *                                  rename info comes from --name-status)
 */
import type { NumstatRow } from '../providers/git.js';

export function parseNumstat(input: string): NumstatRow[] {
  if (input.length === 0) return [];
  const normalized = input.replace(/\r\n/g, '\n');
  const rows: NumstatRow[] = [];

  for (const line of normalized.split('\n')) {
    if (line.length === 0) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const addedRaw = parts[0] ?? '';
    const deletedRaw = parts[1] ?? '';
    const path = parts.slice(2).join('\t');

    const linesAdded = addedRaw === '-' ? null : Number.parseInt(addedRaw, 10);
    const linesDeleted = deletedRaw === '-' ? null : Number.parseInt(deletedRaw, 10);

    if (linesAdded !== null && Number.isNaN(linesAdded)) continue;
    if (linesDeleted !== null && Number.isNaN(linesDeleted)) continue;

    rows.push({ linesAdded, linesDeleted, path });
  }

  return rows;
}

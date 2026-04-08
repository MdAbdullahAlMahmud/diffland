/**
 * Blast score — a single 0..100 number summarizing the scope of a diff.
 *
 *   score = (dirsAffected / totalDirs)   * 40
 *         + (filesChanged / totalFiles)  * 40
 *         + min(totalLinesChanged / 500, 1) * 20
 *
 * See DIFFLAND_ARCHITECTURE.md §9.
 */
import type { BlastScore, DiffNode } from '../schema/v1.js';

export interface BlastInput {
  tree: DiffNode;
  flatFiles: readonly DiffNode[];
}

function countDirs(node: DiffNode): { total: number; affected: number } {
  let total = 0;
  let affected = 0;
  const walk = (n: DiffNode): void => {
    if (n.type === 'dir') {
      // Exclude the synthetic root from totals so small repos aren't dominated by it.
      if (n.path !== '') {
        total += 1;
        if (n.changeType !== 'none') affected += 1;
      }
      for (const c of n.children ?? []) walk(c);
    }
  };
  walk(node);
  return { total, affected };
}

function labelFor(score: number): BlastScore['label'] {
  if (score <= 25) return 'focused';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'scattered';
  return 'chaos';
}

export function computeBlastScore(input: BlastInput): BlastScore {
  const { total: totalDirs, affected: dirsAffected } = countDirs(input.tree);
  const totalFiles = input.flatFiles.length;
  const changedFiles = input.flatFiles.filter((f) => f.changeType !== 'none');
  const filesChanged = changedFiles.length;
  const totalLinesChanged = changedFiles.reduce((s, f) => s + f.linesAdded + f.linesDeleted, 0);

  const dirRatio = totalDirs > 0 ? dirsAffected / totalDirs : 0;
  const fileRatio = totalFiles > 0 ? filesChanged / totalFiles : 0;
  const lineRatio = Math.min(totalLinesChanged / 500, 1);

  const raw = dirRatio * 40 + fileRatio * 40 + lineRatio * 20;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  return {
    score,
    dirsAffected,
    filesChanged,
    totalLinesChanged,
    label: labelFor(score),
  };
}

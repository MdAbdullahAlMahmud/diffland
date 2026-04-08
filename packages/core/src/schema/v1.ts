/**
 * DiffLandData v1 — the single serializable artifact every renderer consumes.
 *
 * Rules (see DIFFLAND_ARCHITECTURE.md §5):
 *   - breaking change → bump SCHEMA_VERSION and @diffland/core major
 *   - additive change (new optional field) → minor
 *   - `--json` output is exactly this shape; it is a public API
 */
import { z } from 'zod';

export const SCHEMA_VERSION = 1 as const;

export const changeTypeSchema = z.enum(['modified', 'added', 'deleted', 'renamed', 'none']);
export type ChangeType = z.infer<typeof changeTypeSchema>;

// Recursive DiffNode — z.lazy + explicit type annotation.
// `children` / `imports` are `| undefined` (not just optional-missing) to
// stay compatible with zod's inferred type under exactOptionalPropertyTypes.
export interface DiffNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'dir';
  ext: string;
  changeType: ChangeType;
  linesAdded: number;
  linesDeleted: number;
  netLines: number;
  size: number;
  sizeRatio: number;
  daysSinceChange: number | null;
  children?: DiffNode[] | undefined;
  imports?: string[] | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const diffNodeSchema: z.ZodType<DiffNode, any, any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    type: z.enum(['file', 'dir']),
    ext: z.string(),
    changeType: changeTypeSchema,
    linesAdded: z.number().int().nonnegative(),
    linesDeleted: z.number().int().nonnegative(),
    netLines: z.number().int(),
    size: z.number().int().nonnegative(),
    sizeRatio: z.number().min(0).max(1),
    daysSinceChange: z.number().nullable(),
    children: z.array(diffNodeSchema).optional(),
    imports: z.array(z.string()).optional(),
  }),
);

export const blastScoreSchema = z.object({
  score: z.number().min(0).max(100),
  dirsAffected: z.number().int().nonnegative(),
  filesChanged: z.number().int().nonnegative(),
  totalLinesChanged: z.number().int().nonnegative(),
  label: z.enum(['focused', 'moderate', 'scattered', 'chaos']),
});
export type BlastScore = z.infer<typeof blastScoreSchema>;

export const diffLandMetaSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  branch: z.string(),
  baseRef: z.string(),
  headRef: z.string(),
  repoName: z.string(),
  generatedAt: z.number().int(),
  diffland: z.object({ version: z.string() }),
});
export type DiffLandMeta = z.infer<typeof diffLandMetaSchema>;

export const diffLandDataSchema = z.object({
  meta: diffLandMetaSchema,
  tree: diffNodeSchema,
  flatFiles: z.array(diffNodeSchema),
  blast: blastScoreSchema,
  importGraph: z.record(z.string(), z.array(z.string())),
});
export type DiffLandData = z.infer<typeof diffLandDataSchema>;

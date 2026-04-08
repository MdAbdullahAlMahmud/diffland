/**
 * @diffland/core — pure engine.
 *
 * This package must remain free of I/O. Never import `fs`, `child_process`,
 * or any git library here. All I/O comes in through GitProvider / FsProvider
 * interfaces (Phase 1).
 */

export const CORE_VERSION = '0.0.0' as const;

export function hello(): string {
  return 'diffland core alive';
}

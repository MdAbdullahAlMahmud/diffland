/**
 * @diffland/core — pure engine.
 *
 * This package must remain free of I/O. Never import `fs`, `child_process`,
 * or any git library here. All I/O comes in through GitProvider / FsProvider
 * interfaces.
 */

export * from './schema/v1.js';
export * from './providers/index.js';
export * from './parser/index.js';
export * from './tree/index.js';
export * from './blast/index.js';
export * from './analyze.js';
export { CORE_VERSION } from './version.js';

export function hello(): string {
  return 'diffland core alive';
}

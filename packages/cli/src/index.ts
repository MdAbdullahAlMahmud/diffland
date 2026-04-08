#!/usr/bin/env node
/**
 * diffland CLI — Phase 0 stub.
 *
 * Real commander wiring lands in Phase 2.
 */
import { hello } from '@diffland/git-node';

export function main(): string {
  return hello();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any).url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-console
  console.log(main());
}

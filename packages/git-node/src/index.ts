/**
 * @diffland/git-node — Node.js I/O providers.
 *
 * This is one of only two places in the repo where `child_process` and `fs`
 * may be imported (the other is `@diffland/git-iso` for the browser).
 */

import { hello as coreHello } from '@diffland/core';

export function hello(): string {
  return `${coreHello()} + git-node`;
}

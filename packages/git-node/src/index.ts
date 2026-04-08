/**
 * @diffland/git-node — Node.js I/O providers.
 *
 * One of only two places in the repo where `child_process` / `fs` imports
 * are permitted (the other is `@diffland/git-iso`). Enforced via eslint
 * boundary rules.
 */
export { createNodeGitProvider, type NodeGitOptions } from './git.js';
export { createNodeFsProvider, type NodeFsOptions } from './fs.js';

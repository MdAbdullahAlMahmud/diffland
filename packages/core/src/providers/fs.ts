/**
 * FsProvider — abstracted filesystem so core stays portable to the browser.
 */

export interface FsStat {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
}

export interface FsProvider {
  stat(path: string): Promise<FsStat>;
  /**
   * Repo-relative POSIX paths, all files, honoring ignore patterns.
   * Implementations should stream to handle large repos.
   */
  listFiles(opts: { ignore?: readonly string[] }): AsyncIterable<string>;
  readFile(path: string): Promise<Uint8Array>;
}

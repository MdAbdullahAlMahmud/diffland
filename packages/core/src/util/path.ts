/**
 * Tiny POSIX-only path helpers so core never imports node:path.
 * All repo paths are normalized to POSIX separators at the provider boundary.
 */

export function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

export function dirname(p: string): string {
  const i = p.lastIndexOf('/');
  return i <= 0 ? '' : p.slice(0, i);
}

export function basename(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? p : p.slice(i + 1);
}

export function extname(p: string): string {
  const base = basename(p);
  const i = base.lastIndexOf('.');
  if (i <= 0) return '';
  return base.slice(i + 1).toLowerCase();
}

export function splitSegments(p: string): string[] {
  return p.split('/').filter((s) => s.length > 0);
}

/** djb2-ish stable string hash, hex. Deterministic, no crypto. */
export function stableHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

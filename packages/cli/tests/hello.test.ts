import { describe, it, expect } from 'vitest';
import { main } from '../src/index.js';

describe('diffland CLI', () => {
  it('main() wires through git-node + core', () => {
    expect(main()).toContain('diffland core alive');
    expect(main()).toContain('git-node');
  });
});

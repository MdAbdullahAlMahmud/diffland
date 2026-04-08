import { describe, it, expect } from 'vitest';
import { hello } from '../src/index.js';

describe('@diffland/git-node', () => {
  it('composes with core', () => {
    expect(hello()).toContain('git-node');
  });
});

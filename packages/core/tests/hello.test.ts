import { describe, it, expect } from 'vitest';
import { hello, CORE_VERSION } from '../src/index.js';

describe('@diffland/core', () => {
  it('hello() returns the alive string', () => {
    expect(hello()).toBe('diffland core alive');
  });

  it('exports a version constant', () => {
    expect(CORE_VERSION).toBe('0.0.0');
  });
});

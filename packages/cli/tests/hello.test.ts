import { describe, it, expect } from 'vitest';
import { main } from '../src/index.js';

describe('diffland CLI stub', () => {
  it('exports main() callable', () => {
    expect(typeof main).toBe('function');
  });
});

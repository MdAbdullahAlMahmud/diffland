import { describe, it, expect } from 'vitest';
import { hello } from '../src/index.js';

describe('@diffland/ui', () => {
  it('composes with core', () => {
    expect(hello()).toContain('ui');
  });
});

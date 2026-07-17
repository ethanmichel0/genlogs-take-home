import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from './config';


describe('resolveApiBaseUrl', () => {
  it('defaults local development to the separate FastAPI server', () => {
    expect(resolveApiBaseUrl(undefined, true)).toBe('http://localhost:8000');
  });

  it('defaults production to same-origin requests', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('');
    expect(resolveApiBaseUrl('', false)).toBe('');
  });

  it('uses an optional override without a trailing slash', () => {
    expect(resolveApiBaseUrl('https://api.example/', false)).toBe('https://api.example');
  });
});

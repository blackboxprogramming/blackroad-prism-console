import { describe, expect, it, beforeEach } from 'vitest';
import { clearRateLimitWindow, rateLimitAttempts } from '@/lib/rateLimit';

describe('rateLimitAttempts', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearRateLimitWindow();
  });

  it('allows up to max attempts', () => {
    expect(rateLimitAttempts('user').allowed).toBe(true);
    expect(rateLimitAttempts('user').allowed).toBe(true);
    expect(rateLimitAttempts('user').allowed).toBe(true);
    expect(rateLimitAttempts('user').allowed).toBe(false);
  });
});

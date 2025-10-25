import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRateLimiter } from '@/hooks/use-rate-limiter';

describe('useRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  it('limits posts to one per minute', () => {
    const { result } = renderHook(() => useRateLimiter());
    expect(result.current.canQueuePost()).toBe(true);
    act(() => {
      result.current.trackQueuedPost();
    });
    expect(result.current.canQueuePost()).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(result.current.canQueuePost()).toBe(true);
  });

  it('limits drafts to five per hour', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let index = 0; index < 5; index += 1) {
      act(() => {
        result.current.trackQueuedPost();
      });
    }
    expect(result.current.canDraft()).toBe(false);
  });
});

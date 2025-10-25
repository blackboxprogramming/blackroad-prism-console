import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTelemetry } from '@/hooks/useTelemetry';

describe('useTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buffers events and flushes in batches', () => {
    const { result } = renderHook(() => useTelemetry());
    act(() => {
      result.current.track({ type: 'lesson_view' });
      result.current.track({ type: 'practice_start' });
      result.current.flush();
    });
    const stored = JSON.parse(window.localStorage.getItem('rw-events') ?? '[]');
    expect(stored).toHaveLength(2);
  });
});

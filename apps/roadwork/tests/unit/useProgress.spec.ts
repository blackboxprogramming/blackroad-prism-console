import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useProgress } from '@/hooks/useProgress';

describe('useProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records attempt and exports data', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.recordAttempt({ id: 'a', lessonId: 'lesson', score: 80 });
    });
    expect(result.current.state.attempts).toHaveLength(1);
    const exported = result.current.exportProgress();
    expect(JSON.parse(exported).attempts).toHaveLength(1);
  });
});

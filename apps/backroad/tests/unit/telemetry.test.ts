import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTelemetry } from '@/hooks/use-telemetry';

describe('useTelemetry', () => {
  it('buffers events and flushes to localStorage', () => {
    vi.useFakeTimers();
    window.localStorage.removeItem('events-backroad');
    const { result } = renderHook(() => useTelemetry());
    act(() => {
      result.current.track('test-event', { value: 1 });
    });
    expect(window.localStorage.getItem('events-backroad')).toBeNull();
    vi.advanceTimersByTime(10_000);
    const stored = window.localStorage.getItem('events-backroad');
    expect(stored).not.toBeNull();
    const events = JSON.parse(stored ?? '[]');
    expect(events[0].name).toBe('test-event');
  });
});

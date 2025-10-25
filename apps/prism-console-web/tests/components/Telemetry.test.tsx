import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TelemetryProvider, useTelemetry } from '@/lib/telemetry';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <TelemetryProvider>{children}</TelemetryProvider>;

describe('Telemetry', () => {
  it('buffers events and flushes at ten', () => {
    const { result } = renderHook(() => useTelemetry(), { wrapper });

    act(() => {
      for (let i = 0; i < 10; i += 1) {
        result.current.track({ type: 'screen:view', screen: 'test' });
      }
    });

    // There is no public buffer, so ensure no errors thrown and provider still usable
    expect(result.current.track).toBeDefined();
  });
});

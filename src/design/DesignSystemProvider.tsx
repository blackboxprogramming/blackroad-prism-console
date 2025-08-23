import React, { useEffect } from 'react';
import { useDesignSignals } from './useDesignSignals';

export function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  const signals = useDesignSignals();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--motion-intensity', String(signals.motionIntensity));
    root.dataset.time = signals.timeOfDay; // morning | evening | night
    if (signals.prefersHighContrast) root.setAttribute('data-contrast', 'more');
    else root.removeAttribute('data-contrast');
  }, [signals]);

  return <>{children}</>;
}

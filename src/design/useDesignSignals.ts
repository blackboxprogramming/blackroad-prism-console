import { useEffect, useMemo, useState } from 'react';

export function useDesignSignals() {
  const [battery, setBattery] = useState<number>(1);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
  const connection = (navigator as any).connection?.effectiveType || '4g';

  useEffect(() => {
    let mounted = true;
    (navigator as any).getBattery?.().then((b: any) => {
      if (!mounted) return;
      setBattery(b.level ?? 1);
      b.addEventListener?.('levelchange', () => mounted && setBattery(b.level ?? 1));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 17 || h < 5) return 'night';
    return 'evening';
  }, []);

  const motionIntensity = useMemo(() => {
    const batteryFactor = battery > 0.2 ? 1 : 0.5;
    const connectionFactor = connection === '4g' ? 1 : 0.7;
    const prefFactor = reducedMotion ? 0.1 : 1;
    return Math.min(batteryFactor, connectionFactor, prefFactor);
  }, [battery, connection, reducedMotion]);

  return { motionIntensity, timeOfDay, prefersHighContrast };
}

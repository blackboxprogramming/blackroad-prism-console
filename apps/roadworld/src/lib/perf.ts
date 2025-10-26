import { useEffect, useState } from 'react';

type Stats = {
  fps: number;
};

export const useFpsCounter = () => {
  const [stats, setStats] = useState<Stats>({ fps: 0 });

  useEffect(() => {
    let frame = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = () => {
      frame += 1;
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 500) {
        setStats({ fps: Math.round((frame * 1000) / delta) });
        frame = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return stats;
};

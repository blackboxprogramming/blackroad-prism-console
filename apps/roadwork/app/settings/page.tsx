'use client';

import { ChangeEvent } from 'react';
import { useA11yPrefs } from '@/hooks/useA11yPrefs';
import { ToastLiveRegion } from '@/components/navigation/ToastLiveRegion';

export default function SettingsPage() {
  const { prefs, setPrefs } = useA11yPrefs();

  return (
    <ToastLiveRegion message={null}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Accessibility preferences</h1>
          <p className="text-slate-600">Control motion, contrast, and font size to match your comfort.</p>
        </header>
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.reducedMotion}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPrefs((prev) => ({ ...prev, reducedMotion: event.target.checked }))
              }
            />
            Reduce motion
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.highContrast}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPrefs((prev) => ({ ...prev, highContrast: event.target.checked }))
              }
            />
            High contrast
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span>Font scale: {prefs.fontScale.toFixed(1)}×</span>
            <input
              type="range"
              min={0.8}
              max={1.4}
              step={0.1}
              value={prefs.fontScale}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPrefs((prev) => ({ ...prev, fontScale: Number(event.target.value) }))
              }
            />
          </label>
        </section>
      </div>
    </ToastLiveRegion>
  );
}

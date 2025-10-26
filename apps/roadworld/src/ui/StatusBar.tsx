'use client';

import { useEditorStore } from '@/state/editorStore';
import { useFpsCounter } from '@/lib/perf';

export const StatusBar = () => {
  const selection = useEditorStore((state) => state.selection);
  const world = useEditorStore((state) => state.world);
  const fps = useFpsCounter();

  return (
    <footer className="flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-2 text-xs text-white/60">
      <span>{selection.length} selected</span>
      <span>Grid: {world.settings.gridSize} | Snap: {world.settings.snapTranslate}m / {world.settings.snapRotateDeg}° / {world.settings.snapScale}</span>
      <span>{fps.fps} fps</span>
    </footer>
  );
};

export default StatusBar;

'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/state/editorStore';
import HelpOverlay from './HelpOverlay';

const toolLabels: { key: string; label: string }[] = [
  { key: 'select', label: 'Select' },
  { key: 'translate', label: 'Move (W)' },
  { key: 'rotate', label: 'Rotate (E)' },
  { key: 'scale', label: 'Scale (R)' },
];

export const TopBar = () => {
  const world = useEditorStore((state) => state.world);
  const history = useEditorStore((state) => state.history);
  const tool = useEditorStore((state) => state.tool);
  const actions = useEditorStore((state) => state.actions);
  const [helpOpen, setHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleExport = async () => {
    const blob = actions.exportWorld();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${world.meta.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await actions.importWorld(file);
    event.target.value = '';
  };

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">{world.meta.name}</span>
        <button className="rounded border border-white/10 px-3 py-1 hover:bg-white/10" onClick={handleExport}>
          Export JSON
        </button>
        <button className="rounded border border-white/10 px-3 py-1 hover:bg-white/10" onClick={handleImportClick}>
          Import JSON
        </button>
        <input ref={fileInputRef} className="hidden" type="file" accept="application/json" onChange={handleImport} />
      </div>
      <div className="flex items-center gap-2">
        {toolLabels.map((item) => (
          <button
            key={item.key}
            className={`rounded px-2 py-1 text-xs ${tool === item.key ? 'bg-accent text-black' : 'border border-white/10 hover:bg-white/10'}`}
            onClick={() => actions.setTool(item.key as any)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border border-white/10 px-3 py-1 hover:bg-white/10 disabled:opacity-40"
          onClick={actions.undo}
          disabled={!history.canUndo}
        >
          Undo
        </button>
        <button
          className="rounded border border-white/10 px-3 py-1 hover:bg-white/10 disabled:opacity-40"
          onClick={actions.redo}
          disabled={!history.canRedo}
        >
          Redo
        </button>
        <button className="rounded border border-white/10 px-3 py-1 hover:bg-white/10" onClick={() => setHelpOpen(true)}>
          Help ?
        </button>
      </div>
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
};

export default TopBar;

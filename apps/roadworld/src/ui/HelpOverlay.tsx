'use client';

import { useEffect } from 'react';

const shortcuts = [
  { key: 'W', description: 'Translate gizmo' },
  { key: 'E', description: 'Rotate gizmo' },
  { key: 'R', description: 'Scale gizmo' },
  { key: 'Ctrl/Cmd + Z', description: 'Undo last action' },
  { key: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
  { key: 'F', description: 'Frame selection' },
  { key: '1/2/3', description: 'Camera presets' },
  { key: 'Del', description: 'Delete selection' },
  { key: 'Shift + Click', description: 'Add to selection' },
  { key: 'Alt + Drag', description: 'Box select (coming soon)' },
];

export type HelpOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export const HelpOverlay = ({ open, onClose }: HelpOverlayProps) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-xl rounded-lg border border-white/10 bg-[#121721] p-6 text-sm shadow-xl">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-semibold">RoadWorld Shortcuts</h2>
          <button className="rounded border border-white/10 px-2 py-1" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.key} className="rounded border border-white/10 px-3 py-2">
              <div className="font-semibold">{shortcut.key}</div>
              <div className="text-white/60">{shortcut.description}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HelpOverlay;

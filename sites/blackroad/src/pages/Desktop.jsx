import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { get, set } from 'idb-keyval';

const DEFAULT_LAYOUT = {
  echo: { open: true, x: 40, y: 40, width: 320, height: 240 },
  llm: { open: true, x: 380, y: 40, width: 320, height: 400 },
  math: { open: false, x: 100, y: 100, width: 320, height: 240 },
  guardian: { open: false, x: 120, y: 120, width: 320, height: 240 },
  api: { open: false, x: 140, y: 140, width: 320, height: 240 },
  files: { open: false, x: 160, y: 160, width: 320, height: 240 },
};

function usePersistedLayout() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  useEffect(() => {
    let alive = true;
    get('prism-desktop-layout').then((saved) => {
      if (saved && alive) setLayout({ ...DEFAULT_LAYOUT, ...saved });
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    set('prism-desktop-layout', layout).catch(() => {});
  }, [layout]);
  return [layout, setLayout];
}

function Window({ id, title, layout, setLayout, children }) {
  const cfg = layout[id];
  if (!cfg?.open) return null;
  const update = (patch) => setLayout((l) => ({ ...l, [id]: { ...l[id], ...patch } }));
  return (
    <Rnd
      bounds="parent"
      size={{ width: cfg.width, height: cfg.height }}
      position={{ x: cfg.x, y: cfg.y }}
      onDragStop={(e, d) => update({ x: d.x, y: d.y })}
      onResizeStop={(e, dir, ref, delta, pos) =>
        update({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: pos.x,
          y: pos.y,
        })
      }
    >
      <div
        className="flex flex-col h-full bg-white border shadow-lg"
        role="dialog"
        aria-labelledby={`${id}-title`}
      >
        <div className="flex items-center justify-between bg-neutral-800 text-white px-2 py-1 cursor-move">
          <span id={`${id}-title`} className="text-sm flex items-center gap-1">
            <span className="text-green-400">●</span>
            {title}
          </span>
          <div className="space-x-1">
            <button type="button" aria-label="minimize" onClick={() => update({ open: false })}>
              _
            </button>
            <button
              type="button"
              aria-label="maximize"
              onClick={() =>
                update({
                  x: 0,
                  y: 0,
                  width: window.innerWidth,
                  height: window.innerHeight,
                })
              }
            >
              □
            </button>
            <button type="button" aria-label="close" onClick={() => update({ open: false })}>
              ×
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </Rnd>
  );
}

export default function Desktop() {
  const [layout, setLayout] = usePersistedLayout();
  const agents = [
    {
      id: 'echo',
      title: 'Echo Agent',
      content: <div className="p-2 text-sm">Echo console coming soon.</div>,
    },
    {
      id: 'llm',
      title: 'LLM Agent',
      content: <div className="p-2 text-sm">LLM chat coming soon.</div>,
    },
    {
      id: 'math',
      title: 'Math Agent',
      content: <div className="p-2 text-sm">Graph canvas coming soon.</div>,
    },
    {
      id: 'guardian',
      title: 'Guardian Agent',
      content: <div className="p-2 text-sm">Contradiction inspector coming soon.</div>,
    },
    {
      id: 'api',
      title: 'API Agent',
      content: <div className="p-2 text-sm">Log tail coming soon.</div>,
    },
    {
      id: 'files',
      title: 'File Explorer',
      content: <div className="p-2 text-sm">File explorer coming soon.</div>,
    },
  ];
  const toggle = (id) => setLayout((l) => ({ ...l, [id]: { ...l[id], open: !l[id]?.open } }));
  return (
    <div
      className="w-screen h-screen relative"
      style={{
        background: 'linear-gradient(135deg,#FF4FD8,#0096FF,#FDBA2D)',
      }}
    >
      {agents.map((a) => (
        <Window key={a.id} id={a.id} title={a.title} layout={layout} setLayout={setLayout}>
          {a.content}
        </Window>
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/70 rounded px-2 py-1 flex gap-2">
        {agents.map((a) => {
          const isOpen = layout[a.id]?.open;
          return (
            <button
              key={a.id}
              type="button"
              aria-label={isOpen ? `Hide ${a.title}` : `Show ${a.title}`}
              aria-pressed={isOpen}
              className={`px-2 py-1 text-sm rounded ${isOpen ? 'bg-white/50' : 'hover:bg-white/50'}`}
              onClick={() => toggle(a.id)}
            >
              {a.title.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

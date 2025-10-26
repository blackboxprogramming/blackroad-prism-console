'use client';

import { useMemo } from 'react';
import { useEditorStore } from '@/state/editorStore';
import { flattenSceneGraph } from '@/lib/selection';

export const SceneGraph = () => {
  const world = useEditorStore((state) => state.world);
  const selection = useEditorStore((state) => state.selection);
  const actions = useEditorStore((state) => state.actions);

  const nodes = useMemo(() => flattenSceneGraph(world).filter((node) => node.id !== world.root), [world]);

  const toggleVisibility = (id: string) => {
    const entity = world.entities[id];
    if (!entity) return;
    actions.updateWorld({
      entities: {
        ...world.entities,
        [id]: {
          ...entity,
          visible: !entity.visible,
        },
      },
    });
  };

  const toggleLock = (id: string) => {
    const entity = world.entities[id];
    if (!entity) return;
    actions.updateWorld({
      entities: {
        ...world.entities,
        [id]: {
          ...entity,
          locked: !entity.locked,
        },
      },
    });
  };

  return (
    <section className="flex h-full flex-col border-r border-white/10 bg-[#0f131a] text-xs">
      <header className="border-b border-white/10 px-3 py-2 text-sm font-semibold">Scene Graph</header>
      <div className="flex-1 overflow-auto px-2 py-2">
        <ul className="space-y-1">
          {nodes.map(({ id, depth, entity }) => (
            <li
              key={id}
              className={`flex items-center justify-between rounded px-2 py-1 hover:bg-white/5 ${
                selection.includes(id) ? 'bg-white/10' : ''
              }`}
            >
              <button className="flex flex-1 items-center gap-2" onClick={() => actions.select([id])}>
                <span className="text-white/30">{Array(depth).fill('•').join('')}</span>
                <span>{entity.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleVisibility(id)} className="text-white/60 hover:text-white">
                  {entity.visible ? '👁️' : '🙈'}
                </button>
                <button onClick={() => toggleLock(id)} className="text-white/60 hover:text-white">
                  {entity.locked ? '🔒' : '🔓'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SceneGraph;

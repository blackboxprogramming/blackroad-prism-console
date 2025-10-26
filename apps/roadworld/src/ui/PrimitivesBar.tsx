'use client';

import { useEditorStore } from '@/state/editorStore';

const primitives: { id: string; label: string }[] = [
  { id: 'cube', label: 'Cube' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'plane', label: 'Plane' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'cone', label: 'Cone' },
  { id: 'torus', label: 'Torus' },
  { id: 'group', label: 'Group' },
];

export const PrimitivesBar = () => {
  const actions = useEditorStore((state) => state.actions);

  const handleAdd = (kind: string) => {
    actions.addEntity(kind as any);
  };

  return (
    <aside className="flex flex-wrap gap-2 border-r border-white/10 bg-[#0f131a] p-3 text-xs">
      {primitives.map((primitive) => (
        <button
          key={primitive.id}
          className="rounded border border-white/10 px-3 py-1 hover:bg-white/10"
          onClick={() => handleAdd(primitive.id)}
        >
          {primitive.label}
        </button>
      ))}
    </aside>
  );
};

export default PrimitivesBar;

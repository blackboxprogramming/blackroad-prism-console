'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/state/editorStore';

export const MaterialEditor = () => {
  const world = useEditorStore((state) => state.world);
  const selection = useEditorStore((state) => state.selection);
  const actions = useEditorStore((state) => state.actions);
  const [color, setColor] = useState('#66d9ff');

  const handleCreate = () => {
    const id = `mat-${uuidv4().slice(0, 6)}`;
    actions.updateWorld({
      materials: [
        ...world.materials,
        {
          id,
          type: 'standard' as const,
          color,
        },
      ],
    });
    if (selection.length) {
      actions.assignMaterial(selection, id);
    }
  };

  const handleDelete = (id: string) => {
    const filtered = world.materials.filter((material) => material.id !== id);
    const entities = Object.fromEntries(
      Object.entries(world.entities).map(([entityId, entity]) => [
        entityId,
        {
          ...entity,
          materialId: entity.materialId === id ? undefined : entity.materialId,
        },
      ]),
    );
    actions.updateWorld({
      materials: filtered,
      entities,
    });
  };

  return (
    <section className="border-t border-white/10 px-4 py-4 text-xs">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-semibold">Materials</h3>
        <div className="flex items-center gap-2">
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          <button className="rounded border border-white/10 px-2 py-1" onClick={handleCreate}>
            New Material
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {world.materials.map((material) => (
          <li key={material.id} className="flex items-center justify-between rounded border border-white/10 px-3 py-2">
            <div className="flex items-center gap-3">
              <span
                className="h-6 w-6 rounded"
                style={{ backgroundColor: material.color }}
                aria-label={`${material.id} swatch`}
              />
              <span>{material.id}</span>
            </div>
            <button className="text-white/60 hover:text-white" onClick={() => handleDelete(material.id)}>
              Delete
            </button>
          </li>
        ))}
        {!world.materials.length && <li className="text-white/40">No materials created yet.</li>}
      </ul>
    </section>
  );
};

export default MaterialEditor;

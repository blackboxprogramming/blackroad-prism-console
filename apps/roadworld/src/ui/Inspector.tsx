'use client';

import { useMemo } from 'react';
import { useEditorStore } from '@/state/editorStore';
import { radToDeg } from '@/lib/math';

const AxisField = ({
  label,
  values,
  onChange,
  step = 0.1,
}: {
  label: string;
  values: [number, number, number];
  onChange: (index: number, value: number) => void;
  step?: number;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-white/60">{label}</span>
    <div className="grid grid-cols-3 gap-2 text-xs">
      {['X', 'Y', 'Z'].map((axis, index) => (
        <label key={axis} className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40">{axis}</span>
          <input
            type="number"
            step={step}
            className="w-full bg-black/40"
            value={Number(values[index].toFixed(3))}
            onChange={(event) => onChange(index, Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  </div>
);

export const Inspector = () => {
  const selection = useEditorStore((state) => state.selection);
  const world = useEditorStore((state) => state.world);
  const snappingEnabled = useEditorStore((state) => state.snappingEnabled);
  const actions = useEditorStore((state) => state.actions);

  const activeEntity = useMemo(() => world.entities[selection[0]], [selection, world.entities]);

  const handleVectorChange = (key: 'position' | 'rotation' | 'scale', index: number, value: number) => {
    if (!activeEntity) return;
    const next = [...activeEntity[key]] as [number, number, number];
    next[index] = key === 'rotation' ? (value * Math.PI) / 180 : value;
    const patch: Record<string, [number, number, number]> = {};
    patch[key] = next;
    actions.transform(activeEntity.id, patch as any);
  };

  const handleMaterialChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeEntity) return;
    const value = event.target.value || null;
    actions.assignMaterial([activeEntity.id], value);
  };

  const handleSnappingToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    actions.toggleSnapping(event.target.checked);
  };

  const handleSettingChange = (key: 'snapTranslate' | 'snapRotateDeg' | 'snapScale', value: number) => {
    actions.updateWorld({
      settings: {
        ...world.settings,
        [key]: value,
      },
    });
  };

  if (!activeEntity) {
    return (
      <aside className="flex h-full flex-col border-l border-white/10 bg-[#0f131a] px-4 py-4 text-sm">
        <h2 className="pb-4 text-sm font-semibold">Inspector</h2>
        <p className="text-xs text-white/60">Select an entity to edit its properties.</p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col border-l border-white/10 bg-[#0f131a] px-4 py-4 text-sm">
      <h2 className="pb-4 text-sm font-semibold">Inspector</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase text-white/60">Name</label>
          <input
            className="mt-1 w-full bg-black/40"
            value={activeEntity.name}
            onChange={(event) =>
              actions.updateWorld({
                entities: {
                  ...world.entities,
                  [activeEntity.id]: {
                    ...activeEntity,
                    name: event.target.value,
                  },
                },
              })
            }
          />
        </div>
        <AxisField
          label="Position"
          values={activeEntity.position}
          onChange={(axis, value) => handleVectorChange('position', axis, value)}
          step={world.settings.snapTranslate}
        />
        <AxisField
          label="Rotation (deg)"
          values={[radToDeg(activeEntity.rotation[0]), radToDeg(activeEntity.rotation[1]), radToDeg(activeEntity.rotation[2])]}
          onChange={(axis, value) => handleVectorChange('rotation', axis, value)}
          step={world.settings.snapRotateDeg}
        />
        <AxisField
          label="Scale"
          values={activeEntity.scale}
          onChange={(axis, value) => handleVectorChange('scale', axis, value)}
          step={world.settings.snapScale}
        />
        <div>
          <label className="text-xs uppercase text-white/60">Material</label>
          <select className="mt-1 w-full bg-black/40" value={activeEntity.materialId ?? ''} onChange={handleMaterialChange}>
            <option value="">Default</option>
            {world.materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.id}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded border border-white/10 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Snapping</span>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={snappingEnabled} onChange={handleSnappingToggle} />
              Enabled
            </label>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40">Translate</span>
              <input
                type="number"
                className="bg-black/40"
                step={0.1}
                value={world.settings.snapTranslate}
                onChange={(event) => handleSettingChange('snapTranslate', Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40">Rotate (deg)</span>
              <input
                type="number"
                className="bg-black/40"
                step={1}
                value={world.settings.snapRotateDeg}
                onChange={(event) => handleSettingChange('snapRotateDeg', Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40">Scale</span>
              <input
                type="number"
                className="bg-black/40"
                step={0.1}
                value={world.settings.snapScale}
                onChange={(event) => handleSettingChange('snapScale', Number(event.target.value))}
              />
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Inspector;

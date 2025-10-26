'use client';

import { useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import type { Object3D } from 'three';
import { useEditorStore } from '@/state/editorStore';
import { useEntityRegistry } from './Entities';

export const Gizmo = () => {
  const selection = useEditorStore((state) => state.selection);
  const tool = useEditorStore((state) => state.tool);
  const actions = useEditorStore((state) => state.actions);
  const registry = useEntityRegistry();
  const ref = useRef<TransformControls>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const controls = ref.current;
    const selectedId = selection[0];
    if (!controls) return;
    controls.enabled = Boolean(selectedId);
    if (!selectedId) {
      controls.detach();
      return;
    }
    const object = registry.current.get(selectedId);
    if (object) {
      controls.attach(object);
    }
  }, [selection, registry]);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    controls.setMode(tool);
  }, [tool]);

  useEffect(() => {
    const controls = ref.current;
    const selectedId = selection[0];
    if (!controls || !selectedId) return;

    const handleDragging = (event: { value: boolean }) => {
      dragging.current = event.value;
      if (event.value) {
        actions.beginAction('transform');
      } else {
        actions.endAction();
        const object = controls.object as Object3D | null;
        if (!object) return;
        actions.transform(
          selectedId,
          {
            position: object.position.toArray() as [number, number, number],
            rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
            scale: object.scale.toArray() as [number, number, number],
          },
        );
      }
    };

    const handleChange = () => {
      if (!dragging.current) return;
      const object = controls.object as Object3D | null;
      if (!object) return;
      actions.transform(
        selectedId,
        {
          position: object.position.toArray() as [number, number, number],
          rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
          scale: object.scale.toArray() as [number, number, number],
        },
        { batch: true },
      );
    };

    controls.addEventListener('dragging-changed', handleDragging);
    controls.addEventListener('change', handleChange);
    return () => {
      controls.removeEventListener('dragging-changed', handleDragging);
      controls.removeEventListener('change', handleChange);
    };
  }, [actions, selection]);

  return <TransformControls ref={ref} />;
};

export default Gizmo;

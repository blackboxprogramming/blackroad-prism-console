import { describe, expect, it } from 'vitest';
import { useEditorStore } from '@/state/editorStore';

describe('editor history', () => {
  it('records add entity and undo/redo', () => {
    const { actions } = useEditorStore.getState();
    const id = actions.addEntity('cube');
    expect(useEditorStore.getState().world.entities[id]).toBeTruthy();
    actions.undo();
    expect(useEditorStore.getState().world.entities[id]).toBeUndefined();
    actions.redo();
    expect(useEditorStore.getState().world.entities[id]).toBeTruthy();
  });
});

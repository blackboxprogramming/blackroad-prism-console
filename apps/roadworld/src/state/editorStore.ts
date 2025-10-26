import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { applySnap } from '@/lib/math';
import { autosaveWorld, createDefaultWorld, exportWorld as doExportWorld, importWorld as parseWorld } from '@/lib/worldIO';
import { filterSelectable } from '@/lib/selection';
import type { EditorStore, Tool } from '@/shared/types';
import type { Primitive, World } from '@/shared/schema';
import { worldSchema } from '@/shared/schema';

const cloneWorld = (world: World): World => structuredClone(world);

const createHistoryEntry = (world: World, selection: string[], description: string) => ({
  world: cloneWorld(world),
  selection: [...selection],
  description,
});

const initialWorld = createDefaultWorld();

export const useEditorStore = create<EditorStore>()(
  devtools((set, get) => ({
    world: initialWorld,
    selection: [],
    tool: 'select',
    snappingEnabled: true,
    history: { canUndo: false, canRedo: false },
    cameraBookmarks: {},
    activeAction: undefined,
    actions: {
      setTool: (tool: Tool) => set({ tool }),
      toggleSnapping: (value) => {
        const next = value ?? !get().snappingEnabled;
        set({ snappingEnabled: next });
      },
      select: (ids, additive) => {
        const filtered = filterSelectable(get().world, ids);
        const nextSelection = additive
          ? Array.from(new Set([...get().selection, ...filtered]))
          : filtered;
        set({ selection: nextSelection });
      },
      transform: (id, patch, options) => {
        const world = cloneWorld(get().world);
        const entity = world.entities[id];
        if (!entity) return;
        if (patch.position) {
          entity.position = get().snappingEnabled
            ? applySnap.translate(patch.position, world.settings.snapTranslate)
            : patch.position;
        }
        if (patch.rotation) {
          entity.rotation = get().snappingEnabled
            ? applySnap.rotate(patch.rotation, world.settings.snapRotateDeg)
            : patch.rotation;
        }
        if (patch.scale) {
          entity.scale = get().snappingEnabled
            ? applySnap.scale(patch.scale, world.settings.snapScale)
            : patch.scale;
        }
        commitHistory(set, world, get().selection, 'Transform entity', options?.batch);
      },
      addEntity: (kind, params) => {
        const world = cloneWorld(get().world);
        const id = uuidv4();
        const entity: Primitive = {
          id,
          kind,
          name: `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          visible: true,
          locked: false,
          layer: 'default',
          params: params ?? {},
          children: [],
        };
        world.entities[id] = entity;
        world.entities[world.root].children = [...world.entities[world.root].children, id];
        commitHistory(set, world, [id], `Add ${kind}`);
        return id;
      },
      deleteSelection: () => {
        const selection = get().selection.filter((id) => id !== get().world.root);
        if (!selection.length) return;
        const world = cloneWorld(get().world);
        selection.forEach((id) => removeEntity(world, id));
        commitHistory(set, world, [], 'Delete selection');
      },
      duplicateSelection: () => {
        const selection = get().selection;
        if (!selection.length) return;
        const world = cloneWorld(get().world);
        const newSelection: string[] = [];
        selection.forEach((id) => {
          const source = world.entities[id];
          if (!source) return;
          const cloneId = uuidv4();
          const clone = structuredClone(source);
          clone.id = cloneId;
          clone.name = `${source.name} Copy`;
          clone.children = [];
          clone.position = [
            source.position[0] + world.settings.snapTranslate,
            source.position[1],
            source.position[2],
          ];
          world.entities[cloneId] = clone;
          const parent = findParent(world, id) ?? world.entities[world.root];
          parent.children = [...parent.children, cloneId];
          newSelection.push(cloneId);
        });
        if (!newSelection.length) return;
        commitHistory(set, world, newSelection, 'Duplicate selection');
      },
      assignMaterial: (ids, materialId) => {
        const world = cloneWorld(get().world);
        ids.forEach((id) => {
          if (world.entities[id]) {
            world.entities[id].materialId = materialId ?? undefined;
          }
        });
        commitHistory(set, world, [...get().selection], 'Assign material');
      },
      updateWorld: (patch) => {
        const parsed = worldSchema.parse({ ...get().world, ...patch });
        commitHistory(set, parsed, [...get().selection], 'Update world');
      },
      undo: () => {
        const state = historyRef.state;
        if (!state.past.length) return;
        const previous = state.past.pop()!;
        if (state.current) {
          state.future.unshift(state.current);
        }
        state.current = previous;
        set({ world: cloneWorld(previous.world), selection: [...previous.selection] });
        syncHistoryFlags(set);
      },
      redo: () => {
        const state = historyRef.state;
        if (!state.future.length) return;
        const next = state.future.shift()!;
        if (state.current) {
          state.past.push(state.current);
        }
        state.current = next;
        set({ world: cloneWorld(next.world), selection: [...next.selection] });
        syncHistoryFlags(set);
      },
      beginAction: (key) => {
        historyRef.state.activeBatch = key;
        set({ activeAction: key });
      },
      endAction: () => {
        historyRef.state.activeBatch = undefined;
        set({ activeAction: undefined });
      },
      exportWorld: () => doExportWorld(get().world),
      importWorld: async (file: File) => {
        const imported = await parseWorld(file);
        commitHistory(set, imported, [], 'Import world');
      },
    },
  })),
);

const historyRef: {
  state: {
    past: ReturnType<typeof createHistoryEntry>[];
    future: ReturnType<typeof createHistoryEntry>[];
    current?: ReturnType<typeof createHistoryEntry>;
    activeBatch?: string;
  };
} = {
  state: {
    past: [],
    future: [],
    current: createHistoryEntry(initialWorld, [], 'Initial world'),
    activeBatch: undefined,
  },
};

const syncHistoryFlags = (set: (partial: Partial<EditorStore>) => void) => {
  set({
    history: {
      canUndo: historyRef.state.past.length > 0,
      canRedo: historyRef.state.future.length > 0,
    },
  });
};

const commitHistory = (
  set: (partial: Partial<EditorStore>) => void,
  world: World,
  selection: string[],
  description: string,
  replace = false,
) => {
  autosaveWorld(world);
  const entry = createHistoryEntry(world, selection, description);
  const state = historyRef.state;
  if (state.activeBatch && replace && state.current) {
    state.current = entry;
    state.future = [];
  } else {
    if (state.current) {
      state.past.push(state.current);
    }
    state.current = entry;
    state.future = [];
  }
  set({ world: cloneWorld(entry.world), selection: [...entry.selection] });
  syncHistoryFlags(set);
};

const findParent = (world: World, childId: string): Primitive | undefined => {
  return Object.values(world.entities).find((entity) => entity.children.includes(childId));
};

const removeEntity = (world: World, id: string) => {
  const entity = world.entities[id];
  if (!entity) return;
  entity.children.forEach((childId) => removeEntity(world, childId));
  const parent = findParent(world, id);
  if (parent) {
    parent.children = parent.children.filter((child) => child !== id);
  }
  delete world.entities[id];
};

syncHistoryFlags((partial) => useEditorStore.setState(partial));

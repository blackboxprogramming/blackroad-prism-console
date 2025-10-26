import type { Material, Primitive, World } from './schema';

export type Tool = 'select' | 'translate' | 'rotate' | 'scale';

export type EditorHistoryEntry = {
  description: string;
  world: World;
  selection: string[];
};

export type EditorStore = {
  world: World;
  selection: string[];
  tool: Tool;
  snappingEnabled: boolean;
  history: {
    canUndo: boolean;
    canRedo: boolean;
  };
  cameraBookmarks: Record<string, {
    position: [number, number, number];
    target: [number, number, number];
  }>;
  activeAction?: string;
  actions: {
    setTool: (tool: Tool) => void;
    toggleSnapping: (value?: boolean) => void;
    select: (ids: string[], additive?: boolean) => void;
    transform: (
      id: string,
      patch: Partial<Pick<Primitive, 'position' | 'rotation' | 'scale'>>,
      options?: { batch?: boolean }
    ) => void;
    addEntity: (kind: Primitive['kind'], params?: Record<string, unknown>) => string;
    deleteSelection: () => void;
    duplicateSelection: () => void;
    assignMaterial: (ids: string[], materialId: string | null) => void;
    updateWorld: (patch: Partial<World>) => void;
    undo: () => void;
    redo: () => void;
    beginAction: (key: string) => void;
    endAction: () => void;
    exportWorld: () => Blob;
    importWorld: (file: File) => Promise<void>;
  };
};

export type InspectorField = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
};

export type SceneNode = {
  id: string;
  entity: Primitive;
  depth: number;
  children: SceneNode[];
};

export type MaterialDraft = Pick<Material, 'id' | 'type' | 'color'> &
  Partial<Omit<Material, 'id' | 'type' | 'color'>>;

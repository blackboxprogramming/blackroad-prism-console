import { v4 as uuidv4 } from 'uuid';
import type { Primitive, World } from '@/shared/schema';

export type GltfImportResult = {
  entity: Primitive;
  objectUrl: string;
};

export const importGltfFile = async (file: File): Promise<GltfImportResult> => {
  const objectUrl = URL.createObjectURL(file);
  const id = uuidv4();
  const entity: Primitive = {
    id,
    kind: 'gltf',
    name: file.name.replace(/\.gltf$/i, ''),
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    visible: true,
    locked: false,
    layer: 'default',
    params: {},
    children: [],
    asset: {
      url: objectUrl,
    },
  };
  return { entity, objectUrl };
};

export const attachGltfEntity = (world: World, entity: Primitive): World => {
  const root = world.entities[world.root];
  return {
    ...world,
    entities: {
      ...world.entities,
      [entity.id]: entity,
      [root.id]: {
        ...root,
        children: [...root.children, entity.id],
      },
    },
  };
};

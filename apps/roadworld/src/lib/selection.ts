import type { Primitive, World } from '@/shared/schema';

export const buildSceneGraph = (world: World) => {
  const traverse = (id: string, depth = 0) => {
    const entity = world.entities[id];
    return {
      id,
      entity,
      depth,
      children: entity.children.map((childId) => traverse(childId, depth + 1)),
    };
  };
  return traverse(world.root);
};

export const flattenSceneGraph = (world: World) => {
  const output: { id: string; depth: number; entity: Primitive }[] = [];
  const walk = (id: string, depth: number) => {
    const entity = world.entities[id];
    output.push({ id, depth, entity });
    entity.children.forEach((childId) => walk(childId, depth + 1));
  };
  walk(world.root, 0);
  return output;
};

export const isPickable = (entity: Primitive): boolean => entity.visible && !entity.locked;

export const filterSelectable = (world: World, ids: string[]): string[] =>
  ids.filter((id) => {
    const entity = world.entities[id];
    return entity ? isPickable(entity) : false;
  });

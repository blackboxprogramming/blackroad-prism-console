import { describe, expect, it } from 'vitest';
import { createDefaultWorld } from '@/lib/worldIO';
import { filterSelectable } from '@/lib/selection';

const world = createDefaultWorld();
world.entities['a'] = {
  id: 'a',
  kind: 'cube',
  name: 'Cube',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  visible: true,
  locked: false,
  layer: 'default',
  params: {},
  children: [],
};
world.entities[world.root].children.push('a');

const lockedWorld = {
  ...world,
  entities: {
    ...world.entities,
    lock: {
      id: 'lock',
      kind: 'cube',
      name: 'Locked',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: true,
      layer: 'default',
      params: {},
      children: [],
    },
  },
};

describe('selection helpers', () => {
  it('filters hidden or locked entities', () => {
    const ids = filterSelectable(lockedWorld, ['a', 'lock', 'missing']);
    expect(ids).toEqual(['a']);
  });
});

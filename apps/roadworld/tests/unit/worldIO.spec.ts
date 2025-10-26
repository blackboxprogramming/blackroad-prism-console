import { describe, expect, it } from 'vitest';
import { createDefaultWorld, exportWorld, importWorld } from '@/lib/worldIO';

const encoder = new TextEncoder();

const createFile = (content: string) =>
  new File([encoder.encode(content)], 'world.json', { type: 'application/json' });

describe('worldIO', () => {
  it('round trips export/import', async () => {
    const world = createDefaultWorld();
    const blob = exportWorld(world);
    const text = await blob.text();
    const imported = await importWorld(createFile(text));
    expect(imported.version).toBe('rw-1');
    expect(Object.keys(imported.entities)).toContain(world.root);
  });
});

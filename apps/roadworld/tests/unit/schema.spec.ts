import { describe, expect, it } from 'vitest';
import { createDefaultWorld } from '@/lib/worldIO';
import { worldSchema } from '@/shared/schema';

const validWorld = createDefaultWorld();

describe('world schema', () => {
  it('accepts a valid world', () => {
    const parsed = worldSchema.parse(validWorld);
    expect(parsed.version).toBe('rw-1');
  });

  it('rejects invalid colors', () => {
    const invalid = {
      ...validWorld,
      settings: {
        ...validWorld.settings,
        background: '#xyz',
      },
    };
    expect(() => worldSchema.parse(invalid)).toThrow();
  });
});

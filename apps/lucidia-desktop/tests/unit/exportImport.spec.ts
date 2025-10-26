import { describe, expect, it, vi } from 'vitest';
import * as moduleUnderTest from '../../src/ui/lib/exportImport';
import { ipc } from '../../src/ui/lib/fs';

vi.mock('../../src/ui/lib/fs', () => ({
  ipc: {
    exportBundle: vi.fn(async () => ({ path: '/tmp/bundle.zip' })),
    importBundle: vi.fn(async () => ({ imported: { memory: 1, tasks: 1, settings: true } }))
  }
}));

describe('export/import helpers', () => {
  it('exports bundle via ipc', async () => {
    const result = await moduleUnderTest.exportBundle();
    expect(result.path).toBe('/tmp/bundle.zip');
  });

  it('imports bundle via ipc', async () => {
    const result = await moduleUnderTest.importBundle('/tmp/bundle.zip');
    expect(result.imported.memory).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';

import { importBundle } from '@/ui/lib/exportImport';

describe('export/import helpers', () => {
  it('rejects archives without manifest', async () => {
    const zip = new JSZip();
    const blob = await zip.generateAsync({ type: 'uint8array' });
    await expect(importBundle(blob)).rejects.toThrow('Invalid bundle');
  });
});

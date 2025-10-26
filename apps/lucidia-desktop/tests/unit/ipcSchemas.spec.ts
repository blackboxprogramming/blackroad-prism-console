import { describe, expect, it } from 'vitest';
import {
  queryCodexInput,
  queryCodexOutput,
  saveMemoryInput,
  listMemoryOutput,
  ipcErrorSchema
} from '../../src/shared/ipcSchemas';

describe('ipc schemas', () => {
  it('validates query input', () => {
    const parsed = queryCodexInput.parse({ q: 'hello', topK: 3 });
    expect(parsed.topK).toBe(3);
  });

  it('rejects invalid query input', () => {
    expect(() => queryCodexInput.parse({})).toThrowError();
  });

  it('parses memory payloads', () => {
    expect(() =>
      saveMemoryInput.parse({ title: 'Doc', tags: ['tag'], content: 'content' })
    ).not.toThrowError();
  });

  it('parses list output shape', () => {
    const payload = listMemoryOutput.parse({ items: [], total: 0 });
    expect(payload.total).toBe(0);
  });

  it('parses error schema', () => {
    const error = ipcErrorSchema.parse({ type: 'io', message: 'failed', code: 'EIO' });
    expect(error.code).toBe('EIO');
  });

  it('rejects invalid error schema', () => {
    expect(() => ipcErrorSchema.parse({ type: 'io' })).toThrowError();
  });
});

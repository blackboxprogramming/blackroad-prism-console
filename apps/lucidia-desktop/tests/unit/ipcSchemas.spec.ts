import { describe, expect, it } from 'vitest';
import {
  deleteMemorySchema,
  getTaskSchema,
  importBundleSchema,
  listMemorySchema,
  listTasksSchema,
  queryCodexSchema,
  runTaskSchema,
  saveMemorySchema,
  secureGetSchema,
  secureSetSchema,
  settingsSchema,
  updateMemorySchema
} from '@/shared/ipcSchemas';

describe('ipc schemas', () => {
  it('validates query codex payload', () => {
    expect(() => queryCodexSchema.parse({ q: 'hello', topK: 3 })).not.toThrow();
  });

  it('rejects empty save memory payload', () => {
    expect(() => saveMemorySchema.parse({ title: '', content: '', tags: [] })).toThrow();
  });

  it('validates list memory pagination', () => {
    const parsed = listMemorySchema.parse({ limit: 5, offset: 0 });
    expect(parsed.limit).toBe(5);
  });

  it('validates update memory patch', () => {
    expect(() => updateMemorySchema.parse({ id: 'abc', patch: { title: 'new' } })).not.toThrow();
  });

  it('validates task commands', () => {
    expect(() => runTaskSchema.parse({ title: 'Build bundle' })).not.toThrow();
    expect(() => listTasksSchema.parse({ status: 'done' })).not.toThrow();
    expect(() => getTaskSchema.parse({ id: 'task-1' })).not.toThrow();
  });

  it('validates secure storage schemas', () => {
    expect(() => secureSetSchema.parse({ key: 'token', value: 'secret' })).not.toThrow();
    expect(() => secureGetSchema.parse({ key: 'token' })).not.toThrow();
  });

  it('validates settings schema', () => {
    const parsed = settingsSchema.parse({
      theme: 'system',
      keybindings: { 'command.palette': 'mod+k' },
      modelRouting: 'local',
      dataDirectory: '',
      network: { allowGateway: false, allowTelemetry: false }
    });
    expect(parsed.theme).toBe('system');
  });

  it('validates import bundle schema', () => {
    expect(() => importBundleSchema.parse({ path: '/tmp/export.zip' })).not.toThrow();
  });

  it('validates delete memory payload', () => {
    expect(() => deleteMemorySchema.parse({ id: '123' })).not.toThrow();
  });
});

import { invoke } from '@tauri-apps/api/tauri';

export const readJsonFile = async <T>(path: string): Promise<T | null> => {
  const response = await invoke('read_json', { path });
  return response as T | null;
};

export const writeJsonFile = async <T>(path: string, data: T): Promise<void> => {
  await invoke('write_json', { path, data });
import { z } from 'zod';
const isTauri = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__);

async function call<T>(cmd: string, payload?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    switch (cmd) {
      case 'secure_get':
        return { value: undefined } as T;
      case 'secure_set':
      case 'secure_delete':
        return { ok: true } as T;
      case 'get_settings':
      case 'save_settings':
        return {
          theme: 'system',
          keybindings: { 'command-palette': 'Mod+K' },
          modelRouting: 'local',
          dataDir: 'lucidia',
          network: { allowGateway: false, allowTelemetry: false }
        } as T;
      case 'list_tasks':
        return [] as T;
      case 'list_memory':
        return { items: [], total: 0 } as T;
      case 'query_codex':
        return { hits: [] } as T;
      case 'save_memory':
        return {
          id: 'local',
          title: payload?.title as string,
          tags: (payload?.tags as string[]) ?? [],
          content: (payload?.content as string) ?? '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          vector: []
        } as T;
      case 'update_memory':
        return {
          id: payload?.id as string,
          title: (payload?.patch as Record<string, unknown>)?.title as string,
          tags: ((payload?.patch as Record<string, unknown>)?.tags as string[]) ?? [],
          content: (payload?.patch as Record<string, unknown>)?.content as string,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          vector: []
        } as T;
      case 'delete_memory':
        return { ok: true } as T;
      case 'run_task':
        return { taskId: 'local-task' } as T;
      case 'get_task':
        return {
          id: 'local-task',
          title: 'Local Task',
          status: 'done',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          log: []
        } as T;
      case 'export_bundle':
        return { path: './lucidia-export.zip' } as T;
      case 'import_bundle':
        return { imported: { memory: 0, tasks: 0, settings: true } } as T;
      default:
        return {} as T;
    }
  }
  return (await import('@tauri-apps/api/core')).invoke<T>(cmd, payload);
}

import {
  queryCodexInput,
  queryCodexOutput,
  saveMemoryInput,
  listMemoryInput,
  listMemoryOutput,
  updateMemoryInput,
  deleteMemoryInput,
  runTaskInput,
  runTaskOutput,
  getTaskInput,
  taskSchema,
  listTasksInput,
  settingsSchema,
  secureSetInput,
  secureGetInput,
  secureDeleteInput,
  secureValueOutput,
  okOutput,
  exportBundleOutput,
  importBundleInput,
  importBundleOutput
} from '../../shared/ipcSchemas';

export const ipc = {
  async queryCodex(input: z.input<typeof queryCodexInput>) {
    const payload = queryCodexInput.parse(input);
    const result = await call('query_codex', payload);
    return queryCodexOutput.parse(result);
  },
  async saveMemory(input: z.input<typeof saveMemoryInput>) {
    const payload = saveMemoryInput.parse(input);
    const result = await call('save_memory', payload);
    return queryCodexOutput.shape.hits.element.parse(result);
  },
  async listMemory(input: z.input<typeof listMemoryInput>) {
    const payload = listMemoryInput.parse(input ?? {});
    const result = await call('list_memory', payload);
    return listMemoryOutput.parse(result);
  },
  async updateMemory(input: z.input<typeof updateMemoryInput>) {
    const payload = updateMemoryInput.parse(input);
    const result = await call('update_memory', payload);
    return queryCodexOutput.shape.hits.element.parse(result);
  },
  async deleteMemory(input: z.input<typeof deleteMemoryInput>) {
    const payload = deleteMemoryInput.parse(input);
    const result = await call('delete_memory', payload);
    return okOutput.parse(result);
  },
  async runTask(input: z.input<typeof runTaskInput>) {
    const payload = runTaskInput.parse(input);
    const result = await call('run_task', payload);
    return runTaskOutput.parse(result);
  },
  async getTask(input: z.input<typeof getTaskInput>) {
    const payload = getTaskInput.parse(input);
    const result = await call('get_task', payload);
    return taskSchema.parse(result);
  },
  async listTasks(input?: z.input<typeof listTasksInput>) {
    const payload = listTasksInput.parse(input ?? {});
    const result = await call('list_tasks', payload);
    return z.array(taskSchema).parse(result);
  },
  async getSettings() {
    const result = await call('get_settings');
    return settingsSchema.parse(result);
  },
  async saveSettings(settings: z.input<typeof settingsSchema>) {
    const payload = settingsSchema.parse(settings);
    const result = await call('save_settings', payload);
    return settingsSchema.parse(result);
  },
  async secureSet(input: z.input<typeof secureSetInput>) {
    const payload = secureSetInput.parse(input);
    const result = await call('secure_set', payload);
    return okOutput.parse(result);
  },
  async secureGet(input: z.input<typeof secureGetInput>) {
    const payload = secureGetInput.parse(input);
    const result = await call('secure_get', payload);
    return secureValueOutput.parse(result);
  },
  async secureDelete(input: z.input<typeof secureDeleteInput>) {
    const payload = secureDeleteInput.parse(input);
    const result = await call('secure_delete', payload);
    return okOutput.parse(result);
  },
  async exportBundle() {
    const result = await call('export_bundle');
    return exportBundleOutput.parse(result);
  },
  async importBundle(input: z.input<typeof importBundleInput>) {
    const payload = importBundleInput.parse(input);
    const result = await call('import_bundle', payload);
    return importBundleOutput.parse(result);
  }
};

import { invoke } from '@tauri-apps/api/tauri';
import { z } from 'zod';
import {
  codexDocSchema,
  deleteMemorySchema,
  getTaskSchema,
  importBundleSchema,
  listMemorySchema,
  listTasksSchema,
  queryCodexSchema,
  runTaskSchema,
  saveMemorySchema,
  secureDeleteSchema,
  secureGetSchema,
  secureSetSchema,
  settingsSchema,
  taskSchema,
  updateMemorySchema
} from '@/shared/ipcSchemas';
import { CodexDoc, Settings, Task } from '@/shared/types';

const okSchema = z.object({ ok: z.literal(true) });

const listMemoryResponseSchema = z.object({
  items: z.array(codexDocSchema),
  total: z.number().int().nonnegative()
});

const queryCodexResponseSchema = z.object({
  hits: z.array(codexDocSchema)
});

export const queryCodex = async (payload: unknown) => {
  const input = queryCodexSchema.parse(payload);
  const response = await invoke('query_codex', { payload: input });
  return queryCodexResponseSchema.parse(response);
};

export const saveMemory = async (payload: unknown): Promise<CodexDoc> => {
  const input = saveMemorySchema.parse(payload);
  const response = await invoke('save_memory', { payload: input });
  return codexDocSchema.parse(response);
};

export const listMemory = async (payload?: unknown) => {
  const input = listMemorySchema.parse(payload ?? {});
  const response = await invoke('list_memory', { payload: input });
  return listMemoryResponseSchema.parse(response);
};

export const updateMemory = async (payload: unknown): Promise<CodexDoc> => {
  const input = updateMemorySchema.parse(payload);
  const response = await invoke('update_memory', { payload: input });
  return codexDocSchema.parse(response);
};

export const deleteMemory = async (payload: unknown) => {
  const input = deleteMemorySchema.parse(payload);
  const response = await invoke('delete_memory', { payload: input });
  return okSchema.parse(response);
};

export const runTask = async (payload: unknown) => {
  const input = runTaskSchema.parse(payload);
  const response = await invoke('run_task', { payload: input });
  return z.object({ taskId: z.string() }).parse(response);
};

export const getTask = async (payload: unknown): Promise<Task> => {
  const input = getTaskSchema.parse(payload);
  const response = await invoke('get_task', { payload: input });
  return taskSchema.parse(response);
};

export const listTasks = async (payload?: unknown): Promise<Task[]> => {
  const input = listTasksSchema.parse(payload ?? {});
  const response = await invoke('list_tasks', { payload: input });
  return z.array(taskSchema).parse(response);
};

export const secureSet = async (payload: unknown) => {
  const input = secureSetSchema.parse(payload);
  const response = await invoke('secure_set', { payload: input });
  return okSchema.parse(response);
};

export const secureGet = async (payload: unknown) => {
  const input = secureGetSchema.parse(payload);
  const response = await invoke('secure_get', { payload: input });
  return z.object({ value: z.string().optional() }).parse(response);
};

export const secureDelete = async (payload: unknown) => {
  const input = secureDeleteSchema.parse(payload);
  const response = await invoke('secure_delete', { payload: input });
  return okSchema.parse(response);
};

export const getSettings = async (): Promise<Settings> => {
  const response = await invoke('get_settings');
  return settingsSchema.parse(response);
};

export const saveSettings = async (payload: Settings): Promise<Settings> => {
  const input = settingsSchema.parse(payload);
  const response = await invoke('save_settings', { payload: input });
  return settingsSchema.parse(response);
};

export const exportBundle = async () => {
  const response = await invoke('export_bundle');
  return z.object({ path: z.string() }).parse(response);
};

export const importBundle = async (payload: unknown) => {
  const input = importBundleSchema.parse(payload);
  const response = await invoke('import_bundle', { payload: input });
  return z
    .object({
      imported: z.object({
        memory: z.number().int().nonnegative(),
        tasks: z.number().int().nonnegative(),
        settings: z.boolean()
      })
    })
    .parse(response);
};

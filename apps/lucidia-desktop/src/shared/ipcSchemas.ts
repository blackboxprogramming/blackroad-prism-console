import { z } from 'zod';

export const codexDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  vector: z.array(z.number())
});

export const taskLogEntrySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string(),
  timestamp: z.string()
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['todo', 'running', 'done', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
  logs: z.array(taskLogEntrySchema)
});

export const settingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  keybindings: z.record(z.string()),
  modelRouting: z.enum(['local', 'gateway']),
  dataDirectory: z.string(),
  network: z.object({
    allowGateway: z.boolean(),
    allowTelemetry: z.boolean()
  })
});

export const queryCodexSchema = z.object({
  q: z.string().min(1),
  topK: z.number().int().positive().max(50).optional(),
  tags: z.array(z.string()).optional()
});

export const saveMemorySchema = z.object({
  title: z.string().min(1),
  tags: z.array(z.string()).default([]),
  content: z.string().min(1)
});

export const listMemorySchema = z.object({
  tag: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional()
});

export const updateMemorySchema = z.object({
  id: z.string(),
  patch: z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    content: z.string().optional()
  })
});

export const deleteMemorySchema = z.object({
  id: z.string()
});

export const runTaskSchema = z.object({
  title: z.string(),
  args: z.record(z.unknown()).optional()
});

export const getTaskSchema = z.object({
  id: z.string()
});

export const listTasksSchema = z.object({
  status: z.enum(['todo', 'running', 'done', 'failed']).optional()
});

export const secureSetSchema = z.object({
  key: z.string(),
  value: z.string()
});

export const secureGetSchema = z.object({
  key: z.string()
});

export const secureDeleteSchema = z.object({
  key: z.string()
});

export const exportBundleSchema = z.object({});

export const importBundleSchema = z.object({
  path: z.string()
});

export type CodexDoc = z.infer<typeof codexDocSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Settings = z.infer<typeof settingsSchema>;

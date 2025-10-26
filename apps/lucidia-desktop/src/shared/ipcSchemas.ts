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
  log: z.array(taskLogEntrySchema)
});

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  keybindings: z.record(z.string()),
  modelRouting: z.enum(['local', 'gateway']),
  dataDir: z.string(),
  network: z.object({
    allowGateway: z.boolean(),
    allowTelemetry: z.boolean()
  })
});

export const queryCodexInput = z.object({
  q: z.string(),
  topK: z.number().optional(),
  tags: z.array(z.string()).optional()
});
export const queryCodexOutput = z.object({
  hits: z.array(codexDocSchema)
});

export const saveMemoryInput = z.object({
  title: z.string(),
  tags: z.array(z.string()).default([]),
  content: z.string()
});

export const listMemoryInput = z.object({
  tag: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
});
export const listMemoryOutput = z.object({
  items: z.array(codexDocSchema),
  total: z.number()
});

export const updateMemoryInput = z.object({
  id: z.string(),
  patch: z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    content: z.string().optional()
  })
});

export const deleteMemoryInput = z.object({
  id: z.string()
});

export const runTaskInput = z.object({
  title: z.string(),
  args: z.record(z.any()).optional()
});
export const runTaskOutput = z.object({
  taskId: z.string()
});

export const getTaskInput = z.object({
  id: z.string()
});

export const listTasksInput = z.object({
  status: z.enum(['todo', 'running', 'done', 'failed']).optional()
});

export const secureSetInput = z.object({
  key: z.string(),
  value: z.string()
});
export const secureGetInput = z.object({
  key: z.string()
});
export const secureDeleteInput = z.object({
  key: z.string()
});

export const secureValueOutput = z.object({
  value: z.string().optional()
});

export const okOutput = z.object({
  ok: z.literal(true)
});

export const getSettingsOutput = settingsSchema;

export const exportBundleOutput = z.object({
  path: z.string()
});

export const importBundleInput = z.object({
  path: z.string()
});
export const importBundleOutput = z.object({
  imported: z.object({
    memory: z.number(),
    tasks: z.number(),
    settings: z.boolean()
  })
});

export const ipcErrorSchema = z.object({
  type: z.string(),
  message: z.string(),
  code: z.string().optional()
});

export type CodexDoc = z.infer<typeof codexDocSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Settings = z.infer<typeof settingsSchema>;

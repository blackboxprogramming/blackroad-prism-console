export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ChatThread {
  id: string;
  title: string;
  systemPrompt?: string;
  temperature?: number;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  systemPrompt: string;
  temperature: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CodexDoc {
  id: string;
  title: string;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
  vector: number[];
}

export type TaskStatus = 'todo' | 'running' | 'done' | 'failed';

export interface TaskLogEntry {
  id: string;
  taskId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  logs: TaskLogEntry[];
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  keybindings: Record<string, string>;
  modelRouting: 'local' | 'gateway';
  dataDirectory: string;
  log: TaskLogEntry[];
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  keybindings: Record<string, string>;
  modelRouting: 'local' | 'gateway';
  dataDir: string;
  network: {
    allowGateway: boolean;
    allowTelemetry: boolean;
  };
}

export interface TelemetryEvent {
  id: string;
  type: 'chat_send' | 'memory_add' | 'task_run' | 'export' | 'import';
  createdAt: string;
  payload: Record<string, unknown>;
}

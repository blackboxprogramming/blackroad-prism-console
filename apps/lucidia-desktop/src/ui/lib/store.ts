import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '@/shared/types';
import { getSettings, saveSettings } from './ipc';

interface SettingsState extends Settings {
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  keybindings: {
    'command.palette': 'mod+k'
  },
  modelRouting: 'local',
  dataDirectory: '',
  network: {
    allowGateway: false,
    allowTelemetry: false
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      async hydrate() {
        const loaded = await getSettings();
        set({ ...defaultSettings, ...loaded });
      },
      async update(patch) {
        const next = { ...get(), ...patch } as Settings;
        const saved = await saveSettings(next);
        set(saved);
      }
    }),
    {
      name: 'lucidia-settings',
      partialize: (state) => ({
        theme: state.theme,
        keybindings: state.keybindings,
        modelRouting: state.modelRouting,
        dataDirectory: state.dataDirectory,
        network: state.network
      })
    }
  )
);
import { nanoid } from 'nanoid/non-secure';
import { ChatMessage, ChatThread, CodexDoc, Task } from '../../shared/types';
import { DEFAULT_TOP_K } from '../../shared/constants';
import { embedText, cosineSimilarity } from './vectors';

interface ChatState {
  threads: ChatThread[];
  activeThreadId?: string;
  createThread: (title: string) => void;
  postMessage: (threadId: string, role: ChatMessage['role'], content: string) => void;
  setActiveThread: (id: string) => void;
}

interface CodexState {
  docs: CodexDoc[];
  addDoc: (input: { title: string; tags: string[]; content: string }) => CodexDoc;
  search: (query: string, topK?: number) => CodexDoc[];
}

interface TaskState {
  tasks: Task[];
  addTask: (title: string) => Task;
  updateTaskStatus: (id: string, status: Task['status']) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: undefined,
  createThread: (title) => {
    const id = nanoid();
    const now = new Date().toISOString();
    const thread: ChatThread = {
      id,
      title,
      systemPrompt: 'You are Lucidia, a helpful local assistant.',
      temperature: 0.2,
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    set((state) => ({ threads: [...state.threads, thread], activeThreadId: id }));
  },
  setActiveThread: (id) => {
    set({ activeThreadId: id });
  },
  postMessage: (threadId, role, content) => {
    const now = new Date().toISOString();
    set((state) => ({
      threads: state.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: [
                ...thread.messages,
                {
                  id: nanoid(),
                  role,
                  content,
                  createdAt: now
                }
              ],
              updatedAt: now
            }
          : thread
      )
    }));
  }
}));

export const useCodexStore = create<CodexState>((set, get) => ({
  docs: [],
  addDoc: ({ title, tags, content }) => {
    const now = new Date().toISOString();
    const vector = embedText(content);
    const doc: CodexDoc = {
      id: nanoid(),
      title,
      tags,
      content,
      createdAt: now,
      updatedAt: now,
      vector
    };
    set((state) => ({ docs: [...state.docs, doc] }));
    return doc;
  },
  search: (query, topK = DEFAULT_TOP_K) => {
    const qVec = embedText(query);
    return get()
      .docs.map((doc) => ({
        doc,
        score: cosineSimilarity(qVec, doc.vector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((entry) => entry.doc);
  }
}));

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  addTask: (title) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: nanoid(),
      title,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      tags: [],
      log: []
    };
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },
  updateTaskStatus: (id, status) => {
    const now = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status, updatedAt: now } : task
      )
    }));
  }
}));

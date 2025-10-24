import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

export type ChatAttachmentKind = 'image' | 'json' | 'csv' | 'webm';

export interface ChatAttachment {
  kind: ChatAttachmentKind;
  url: string;
  bytes?: number;
}

export type ChatRole = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  jobId?: string;
  author: string;
  role: ChatRole;
  ts: string;
  text: string;
  reactions: Record<string, number>;
  attachments: ChatAttachment[];
  redactions: string[];
}

export interface CreateMessageInput {
  jobId?: string;
  author: string;
  role: ChatRole;
  text: string;
  attachments?: ChatAttachment[];
  redactions?: string[];
}

export type ChatListener = (message: ChatMessage) => void;

const GLOBAL_THREAD_KEY = '*';

export class ChatStore {
  private readonly threads = new Map<string, ChatMessage[]>();
  private readonly emitter = new EventEmitter();

  constructor(private readonly now: () => Date = () => new Date()) {}

  getThread(jobId?: string): ChatMessage[] {
    const key = jobId ?? GLOBAL_THREAD_KEY;
    const thread = this.threads.get(key);
    if (!thread) {
      return [];
    }
    return thread.slice();
  }

  post(input: CreateMessageInput): ChatMessage {
    const key = input.jobId ?? GLOBAL_THREAD_KEY;
    const ts = this.now().toISOString();
    const message: ChatMessage = {
      id: randomUUID(),
      jobId: input.jobId,
      author: input.author,
      role: input.role,
      ts,
      text: input.text,
      attachments: (input.attachments ?? []).map((attachment) => ({ ...attachment })),
      reactions: {},
      redactions: input.redactions?.slice() ?? [],
    };

    const thread = this.threads.get(key) ?? [];
    thread.push(message);
    this.threads.set(key, thread);

    // Emit per-thread and global listeners.
    this.emitter.emit(key, message);
    if (key !== GLOBAL_THREAD_KEY) {
      this.emitter.emit(GLOBAL_THREAD_KEY, message);
    }

    return message;
  }

  react(messageId: string, reaction: string, delta: number): ChatMessage | undefined {
    for (const thread of this.threads.values()) {
      const match = thread.find((entry) => entry.id === messageId);
      if (match) {
        const current = match.reactions[reaction] ?? 0;
        match.reactions[reaction] = Math.max(0, current + delta);
        this.emitter.emit(match.jobId ?? GLOBAL_THREAD_KEY, match);
        if (match.jobId) {
          this.emitter.emit(GLOBAL_THREAD_KEY, match);
        }
        return match;
      }
    }
    return undefined;
  }

  on(jobId: string | undefined, listener: ChatListener): () => void {
    const key = jobId ?? GLOBAL_THREAD_KEY;
    this.emitter.on(key, listener);
    return () => {
      this.emitter.off(key, listener);
    };
  }
}

export const defaultChatStore = new ChatStore();

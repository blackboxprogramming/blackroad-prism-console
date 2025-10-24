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
  reactions?: Record<string, number>;
  attachments?: ChatAttachment[];
  redactions?: string[];
}

export interface ConnectOptions {
  baseUrl?: string;
  jobId?: string;
  protocol?: 'graphql' | 'sse';
  fetchImpl?: typeof fetch;
  eventSourceCtor?: typeof EventSource;
  retry?: {
    initial?: number;
    max?: number;
  };
}

export interface ChatClient {
  subscribe(handler: (message: ChatMessage) => void): () => void;
  fetchThread(): Promise<ChatMessage[]>;
  post(text: string, attachments?: ChatAttachment[]): Promise<ChatMessage>;
  close(): void;
  protocol: 'graphql' | 'sse';
}

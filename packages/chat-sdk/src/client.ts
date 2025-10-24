import { type ChatAttachment, type ChatClient, type ChatMessage, type ConnectOptions } from './types';

function join(base: string | undefined, path: string): string {
  if (!base) return path;
  if (base.endsWith('/')) {
    return `${base.slice(0, -1)}${path}`;
  }
  return `${base}${path}`;
}

function encodeQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.append(key, value);
    }
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function connect(options: ConnectOptions = {}): ChatClient {
  const protocol = options.protocol ?? 'graphql';
  const baseUrl = options.baseUrl ?? '';
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  const EventSourceCtor = options.eventSourceCtor ?? globalThis.EventSource;
  if (!EventSourceCtor) {
    throw new Error('EventSource is not available in this environment');
  }
  if (!fetchImpl) {
    throw new Error('fetch is not available in this environment');
  }

  const subscribers = new Set<(message: ChatMessage) => void>();
  let eventSource: EventSource | null = null;
  let closed = false;
  const retryInitial = options.retry?.initial ?? 500;
  const retryMax = options.retry?.max ?? 4000;
  let retryDelay = retryInitial;

  const notify = (message: ChatMessage) => {
    for (const listener of subscribers) {
      listener(message);
    }
  };

  const openStream = () => {
    if (closed) return;
    const query = encodeQuery({
      topic: 'chat',
      jobId: options.jobId,
      protocol,
    });
    const url = `${join(baseUrl, '/events/stream')}${query}`;
    const next = new EventSourceCtor(url);
    next.addEventListener('message', (event: MessageEvent) => {
      retryDelay = retryInitial;
      try {
        const payload = JSON.parse(event.data) as ChatMessage;
        notify(payload);
      } catch (error) {
        console.warn('chat-sdk: failed to parse message', error);
      }
    });
    next.addEventListener('error', () => {
      next.close();
      if (closed) return;
      const timeout = retryDelay;
      retryDelay = Math.min(retryDelay * 2, retryMax);
      setTimeout(() => openStream(), timeout);
    });
    eventSource = next as unknown as EventSource;
  };

  openStream();

  return {
    protocol,
    subscribe(handler) {
      subscribers.add(handler);
      return () => {
        subscribers.delete(handler);
      };
    },
    async fetchThread() {
      const query = encodeQuery({ jobId: options.jobId });
      const response = await fetchImpl(`${join(baseUrl, '/api/chat/thread')}${query}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`chat-sdk: failed to load thread (${response.status})`);
      }
      return (await response.json()) as ChatMessage[];
    },
    async post(text: string, attachments?: ChatAttachment[]) {
      const response = await fetchImpl(join(baseUrl, '/api/chat/post'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: options.jobId, text, attachments }),
      });
      if (!response.ok) {
        throw new Error(`chat-sdk: failed to post message (${response.status})`);
      }
      const payload = (await response.json()) as ChatMessage;
      notify(payload);
      return payload;
    },
    close() {
      closed = true;
      eventSource?.close();
      eventSource = null;
      subscribers.clear();
    },
  };
}

export type { ChatAttachment, ChatClient, ChatMessage, ConnectOptions } from './types';

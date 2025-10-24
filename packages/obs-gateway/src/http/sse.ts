import { ServerResponse } from 'node:http';
import { ExecutionResult } from '../graphql';

export type AsyncEventStream = AsyncIterableIterator<ExecutionResult>;

export async function streamToSse(stream: AsyncEventStream, res: ServerResponse): Promise<void> {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  });

  try {
    for await (const payload of stream) {
      res.write(`data: ${JSON.stringify(payload.data)}\n\n`);
    }
  } finally {
    res.end();
  }
}

import type { Request, Response } from 'express';
import { defaultChatStore, type ChatMessage } from '../chat/store';

export interface StreamOptions {
  heartbeatMs?: number;
  store?: typeof defaultChatStore;
}

function write(res: Response, event: string, payload: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function streamChat(req: Request, res: Response, options: StreamOptions = {}): void {
  const store = options.store ?? defaultChatStore;
  const heartbeatMs = options.heartbeatMs ?? 15000;
  const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const dispose = store.on(jobId, (message: ChatMessage) => {
    write(res, 'message', message);
  });

  let closed = false;
  const timer = setInterval(() => {
    if (!closed) {
      write(res, 'heartbeat', { ts: new Date().toISOString() });
    }
  }, heartbeatMs);

  req.on('close', () => {
    closed = true;
    clearInterval(timer);
    dispose();
  });

  // Replay historical messages to the subscriber so the viewer hydrates quickly.
  const history = store.getThread(jobId);
  history.forEach((message) => write(res, 'message', message));
}

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


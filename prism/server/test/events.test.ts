import { describe, it, expect } from 'vitest';
import { AddressInfo } from 'net';
import supertest from 'supertest';
import http from 'http';
import { createServer } from '../src/server';
import { PrismEvent } from '@prism/core';
import { nanoid } from 'nanoid';

function openSSE(url: string): Promise<PrismEvent> {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      res.setEncoding('utf8');
      let buffer = '';
      res.on('data', chunk => {
        buffer += chunk;
        const match = buffer.match(/data: (.*)\n\n/);
        if (match) {
          resolve(JSON.parse(match[1]));
          req.destroy();
        }
      });
    });
  });
}

describe('events API', () => {
  it('persists and streams events', async () => {
    const app = await createServer(':memory:');
    await app.listen({ port: 0 });
    const port = (app.server.address() as AddressInfo).port;

    const ssePromise = openSSE(`http://127.0.0.1:${port}/events/stream?projectId=p1&sessionId=s1`);

    const event: PrismEvent = {
      id: nanoid(),
      ts: new Date().toISOString(),
      actor: 'user',
      kind: 'prompt',
      projectId: 'p1',
      sessionId: 's1',
      facet: 'intent',
      summary: 'hi'
    };

    await supertest(app.server).post('/events').send(event).expect(200);

    const received = await ssePromise;
    expect(received.id).toBe(event.id);

    const res = await supertest(app.server).get('/events').query({ projectId: 'p1', limit: 100 });
    expect(res.body[0].id).toBe(event.id);

    await app.close();
  });
});

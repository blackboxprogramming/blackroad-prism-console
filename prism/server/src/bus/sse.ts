import { FastifyReply } from 'fastify';
import { PrismEvent } from '@prism/core';

const clients = new Set<FastifyReply>();

export function register(reply: FastifyReply) {
  clients.add(reply);
  reply.raw.on('close', () => {
    clients.delete(reply);
  });
}

export function broadcast(event: PrismEvent) {
  const payload = `event: prism\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.raw.write(payload);
  }
}

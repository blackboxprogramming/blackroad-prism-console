import { FastifyReply } from 'fastify';
import { IntelligenceEvent } from '../types';

const clients = new Set<FastifyReply>();

export function register(reply: FastifyReply) {
  clients.add(reply);
  reply.raw.on('close', () => {
    clients.delete(reply);
  });
}

export function broadcast(event: IntelligenceEvent) {
  const payload = `event: intelligence\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.raw.write(payload);
  }
}

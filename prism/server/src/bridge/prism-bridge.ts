import fs from 'fs';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import websocket, { SocketStream } from '@fastify/websocket';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { IntelligenceEvent } from '../types';
import { insertIntelligenceEvent, getHydrationEvents } from '../db/sqlite';
import { broadcast as broadcastIntelligence } from '../bus/intelligence';

const schemaUrl = new URL('../../../../schemas/lucidia/intelligence-event.schema.json', import.meta.url);
const schema = JSON.parse(fs.readFileSync(schemaUrl, 'utf-8'));
const ajv = new Ajv({ strict: false });
addFormats(ajv);
const validate = ajv.compile<IntelligenceEvent>(schema);

const sockets = new Set<SocketStream['socket']>();

export function sendToBridge(event: IntelligenceEvent) {
  const payload = JSON.stringify({ type: 'event', data: event });
  for (const socket of sockets) {
    if (socket.readyState === 1) {
      socket.send(payload);
    }
  }
}

const bridgePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(websocket);

  fastify.get('/api/event/bridge', { websocket: true }, (connection) => {
    const { socket } = connection;
    sockets.add(socket);
    const hydration = getHydrationEvents(200);
    socket.send(JSON.stringify({ type: 'hydrate', events: hydration }));

    socket.on('message', (raw) => {
      let message: any;
      try {
        message = JSON.parse(raw.toString());
      } catch (err) {
        socket.send(JSON.stringify({ type: 'error', error: 'invalid_json' }));
        return;
      }
      if (message?.type === 'identify') {
        socket.send(JSON.stringify({ type: 'ack', id: 'identify' }));
        return;
      }
      if (message?.type === 'event') {
        const event = message.data as IntelligenceEvent;
        if (!validate(event)) {
          socket.send(JSON.stringify({ type: 'error', error: 'invalid_event', details: validate.errors }));
          return;
        }
        insertIntelligenceEvent(event);
        broadcastIntelligence(event);
        socket.send(JSON.stringify({ type: 'ack', id: event.id }));
      }
    });

    socket.on('close', () => {
      sockets.delete(socket);
    });
  });
};

export default bridgePlugin;

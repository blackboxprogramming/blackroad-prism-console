import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import eventsRoutes from './routes/events';
import diffsRoutes from './routes/diffs';
import policyRoutes from './routes/policy';
import healthRoutes from './routes/health';
import { initDb } from './db/sqlite';

export async function createServer(dbPath = path.resolve(process.cwd(), '../data/prism.sqlite')) {
  initDb(dbPath);
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(eventsRoutes);
  await app.register(diffsRoutes);
  await app.register(policyRoutes);
  await app.register(healthRoutes);
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await createServer();
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await server.listen({ port, host: '0.0.0.0' });
  // eslint-disable-next-line no-console
  console.log(`Prism server listening on ${port}`);
}

import { FastifyInstance } from 'fastify';
export default async function (app: FastifyInstance) {
  app.get('/_ready', async () => ({ ready: true }));
}

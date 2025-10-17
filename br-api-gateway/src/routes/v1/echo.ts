import { FastifyInstance } from 'fastify';
export default async function (app: FastifyInstance) {
  app.post('/echo', {
    schema: {
      body: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] },
      response: { 200: { type: 'object', properties: { msg: { type: 'string' } } } }
    }
  }, async (req) => (req.body as any));
}

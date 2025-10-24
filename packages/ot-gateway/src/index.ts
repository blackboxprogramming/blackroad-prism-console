import { createServer } from '@graphql-yoga/node';
import { schema } from './schema';

const port = Number(process.env.PORT || 4003);

const server = createServer({
  schema,
  maskedErrors: false,
  context: () => ({
    principal: { id: 'system', roles: ['ot:run'] },
  }),
});

server.start({ port }).then(() => {
  // eslint-disable-next-line no-console
  console.log(`OT gateway listening on ${port}`);
});

import { createYoga } from '@graphql-yoga/node';
import http from 'node:http';
import { createSchema } from './schema';
import { createContext } from './auth/rbac';
import { instrumentYoga } from './otel';

export function createServer() {
  const schema = createSchema();
  const yoga = createYoga({
    schema,
    context: createContext
  });
  instrumentYoga(yoga);
  const server = http.createServer(yoga);
  return { server, yoga };
}

if (require.main === module) {
  const { server } = createServer();
  const port = process.env.PORT ? Number(process.env.PORT) : 4006;
  server.listen(port, () => {
    console.log(`graph-gateway listening on :${port}`);
  });
}

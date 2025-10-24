import { createServer } from 'http';
import { createYoga } from '@graphql-yoga/node';
import { schema } from './schema';
import { createContext } from './resolvers/simulation';

export function createGatewayServer() {
  const yoga = createYoga({
    schema,
    context: createContext
  });
  const server = createServer(yoga);
  return { yoga, server };
}

if (require.main === module) {
  const { server } = createGatewayServer();
  const port = Number(process.env.PORT ?? 4600);
  server.listen(port, () => {
    console.log(`economy-gateway listening on http://localhost:${port}/graphql`);
  });
}

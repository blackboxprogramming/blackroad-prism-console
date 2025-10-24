import { createServer } from 'http';
import { createYoga } from '@graphql-yoga/node';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { ControlPlaneStore } from './store';
import { AuditBus } from './audit/bus';
import { authenticate } from './auth/oidc';

async function bootstrap() {
  const store = new ControlPlaneStore();
  await store.load();
  const audit = new AuditBus();

  const yoga = createYoga({
    schema: { typeDefs, resolvers },
    context: ({ request }) => {
      const headers: Record<string, string | undefined> = {};
      request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      const { principal } = authenticate(headers);
      return { store, audit, principal };
    }
  });

  const server = createServer(yoga);
  const port = Number(process.env.PORT ?? 4100);

  server.listen(port, () => {
    console.log(`control-plane-gateway listening on http://localhost:${port}${yoga.graphqlEndpoint}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start control-plane-gateway', error);
  process.exit(1);
});

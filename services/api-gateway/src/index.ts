import { buildServer } from './server.js';
import { env } from './config/env.js';

const server = buildServer();

server.listen({ port: env.PORT, host: '0.0.0.0' }).catch((error) => {
  server.log.error(error, 'Failed to start API Gateway');
  process.exit(1);
});

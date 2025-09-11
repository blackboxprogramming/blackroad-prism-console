import Fastify from 'fastify';
import intelRoutes from './routes/intel';
import policyRoutes from './policy';
import diffRoutes from './routes/diffs';
import runRoutes from './routes/run';
import graphRoutes from './routes/graph';

export function buildServer() {
  const app = Fastify();
  app.register(intelRoutes);
  app.register(policyRoutes);
  app.register(diffRoutes);
  app.register(runRoutes);
  app.register(graphRoutes);
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  app.listen({ port: 3000 }, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Server running on 3000');
  });
}

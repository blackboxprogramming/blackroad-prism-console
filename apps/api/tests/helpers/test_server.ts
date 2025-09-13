import express from 'express';
import health from '../../src/routes/health.ts';
import reco from '../../src/routes/reco.ts';
export function mkServer(){
  const app = express(); app.use(express.json());
  app.use('/api/health', health);
  app.use('/api/reco', reco);
  return app.listen(0);
}

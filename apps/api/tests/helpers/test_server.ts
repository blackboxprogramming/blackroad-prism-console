import express from 'express';
import health from '../../src/routes/health.ts';
import reco from '../../src/routes/reco.ts';
import adminDevices from '../../src/routes/admin/devices.ts';
export function mkServer(){
  const app = express(); app.use(express.json());
  app.use('/api/health', health);
  app.use('/api/reco', reco);
  app.use('/api/admin', adminDevices);
  return app.listen(0);
}

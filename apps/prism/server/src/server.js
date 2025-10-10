import express from 'express';
import { planPerformance } from './planner.js';
import { ValidationError } from './errors.js';

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/perform', async (req, res) => {
    try {
      const plan = await planPerformance(req.body);
      res.json(plan);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message, details: err.details ?? null });
      } else {
        console.error('[perform] unexpected error', err);
        res.status(500).json({ error: 'internal_error' });
      }
    }
  });

  return app;
}

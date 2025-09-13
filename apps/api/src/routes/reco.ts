import { Router } from 'express';
import { predict } from '../lib/ml/serve.js';

const r = Router();
r.get('/', (req: any, res) => {
  // toy features: time-of-day, variant A/B
  const hour = new Date().getUTCHours();
  const ab = req.variant === 'B' ? 1 : 0;
  const p = predict([hour/24, ab]);
  const reco = p > 0.5 ? 'PRO_PLAN' : 'STARTER_PLAN';
  res.json({ variant: req.variant || 'A', score: p, recommendation: reco });
});
export default r;

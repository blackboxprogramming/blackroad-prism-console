import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import './lib/otel.js';
import { canaryMiddleware } from './middleware/canary.js';
import { meter } from './middleware/meter.js';
import * as billing from './routes/billing/index.js';
import licenses from './routes/admin/licenses.js';
import { requireEntitlement } from './lib/entitlements.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));
app.use(meter());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import okta from './routes/okta.js';
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);

// Public billing catalog
app.use('/api/billing/plans', billing.plans);

// Partner-scoped routes (assuming apiKeyAuth + rateLimit already applied at /api/partner/* in Prompt 13)
app.use('/api/partner/billing/usage', billing.usage);
app.use('/api/partner/billing', billing.coupons);

// Admin
app.use('/api/admin/licenses', licenses);

// Example entitlement gate for reco advanced
app.get('/api/feature/reco-advanced', requireEntitlement('reco_advanced'), (_req,res)=> res.json({ ok:true }));

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;

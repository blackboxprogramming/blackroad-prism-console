import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import './lib/otel.js';
import { canaryMiddleware } from './middleware/canary.js';
import { apiKeyAuth } from './middleware/api_key.js';
import { rateLimit } from './middleware/rate_limit.js';
import adminKeys from './routes/admin/keys.js';
import adminWebhooks from './routes/admin/webhooks.js';
import deliver from './routes/webhooks/deliver.js';
import ping from './routes/public/ping.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import okta from './routes/okta.js';
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);

// Public
app.use('/api/public/ping', ping);

// Admin (require existing session middleware from earlier prompts)
app.use('/api/admin/keys', adminKeys);
app.use('/api/admin/webhooks', adminWebhooks);

// Partner (API key + limit)
app.use('/api/partner', apiKeyAuth(), rateLimit(), deliver);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;

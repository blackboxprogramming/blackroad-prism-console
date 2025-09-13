import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import health from './routes/health.js';
import subscribe from './routes/subscribe.js';
import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import billing from './routes/billing.js';
import stripeWebhook from './routes/stripe_webhook.js';
import auth from './routes/auth.js';
import slack from './routes/slack.js';
import { sessionMiddleware } from './middleware/session.js';

dotenv.config();
const app = express();

// Slack verification needs raw body for signature
app.use((req: any, res, next) => {
  if (req.url.startsWith('/api/slack/commands')) {
    const data: Buffer[] = [];
    req.on('data', (c: Buffer) => data.push(c));
    req.on('end', () => { req.rawBody = Buffer.concat(data); next(); });
  } else { next(); }
});

app.use(cors());
app.use(express.urlencoded({ extended: true })); // for Slack form payloads
app.use(express.json());
app.use(morgan('combined'));
app.use(sessionMiddleware(process.env.SESSION_SECRET || ''));

app.use('/api/health', health);
app.use('/api/subscribe', subscribe);
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/billing', billing);
app.use('/api/stripe/webhook', stripeWebhook);
app.use('/api/auth', auth);
app.use('/api/slack', slack);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on :${port}`));

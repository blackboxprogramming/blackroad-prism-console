import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import billing from './routes/billing.js';
import stripeWebhook from './routes/stripe_webhook.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/api/billing', billing);
app.use('/api/stripe/webhook', stripeWebhook);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});


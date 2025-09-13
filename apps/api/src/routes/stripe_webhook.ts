import { Router } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
dotenv.config();

const r = Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null;
const whSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

r.post('/', (req, res) => {
  if (!stripe || !whSecret) return res.sendStatus(200); // no-op if disabled
  const sig = req.get('stripe-signature') || '';
  try {
    const chunks: Buffer[] = [];
    req.on('data', c => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(raw, sig, whSecret);
      } catch (err:any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      console.log(`[stripe] ${event.type} id=${event.id}`);
      return res.sendStatus(204);
    });
  } catch { return res.sendStatus(204); }
});

export default r;


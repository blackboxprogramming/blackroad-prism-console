import { Router } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const r = Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null;

r.get('/prices', async (_req, res) => {
  if (!stripe) return res.json({ enabled: false, prices: [] });
  try {
    const prices = await stripe.prices.list({ active: true, limit: 10 });
    res.json({ enabled: true, prices: prices.data.map(p => ({ id: p.id, nickname: p.nickname, unit_amount: p.unit_amount })) });
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

r.post('/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe disabled' });
  const { priceId, successUrl, cancelUrl } = req.body || {};
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: String(priceId), quantity: 1 }],
      success_url: String(successUrl || 'https://blackroad.io?ok=1'),
      cancel_url: String(cancelUrl || 'https://blackroad.io?cancel=1')
    });
    res.json({ url: session.url });
  } catch (e:any) { res.status(400).json({ error: e.message }); }
});

export default r;


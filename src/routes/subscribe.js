'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const stripeSecret = process.env.STRIPE_SECRET_KEY || null;
const stripePublic = process.env.STRIPE_PUBLIC_KEY || null;
const stripe = stripeSecret ? require('stripe')(stripeSecret, { apiVersion: '2022-11-15' }) : null;

// Create tables if they do not exist
function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      stripe_customer_id TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      stripe_subscription_id TEXT UNIQUE,
      plan_id TEXT,
      interval TEXT CHECK(interval IN ('month','year')),
      status TEXT,
      current_period_end INTEGER
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      stripe_invoice_id TEXT UNIQUE,
      total INTEGER,
      currency TEXT,
      paid INTEGER,
      hosted_invoice_url TEXT,
      created INTEGER,
      status TEXT
    );
  `);
}
initTables();

// Helpers
function mapPrice(planId, interval) {
  const key = `STRIPE_PRICE_${planId.toUpperCase()}_${interval === 'year' ? 'YEARLY' : 'MONTHLY'}`;
  return process.env[key];
}

// GET /api/subscribe/config
router.get('/subscribe/config', (req, res) => {
  res.json({ testMode: !stripeSecret, publicKey: stripePublic || null });
});

// GET /api/subscribe/status
router.get('/subscribe/status', requireAuth, (req, res) => {
  const sub = db.prepare('SELECT plan_id, interval, status, current_period_end FROM subscriptions WHERE user_id = ?').get(req.session.userId);
  const invoices = db.prepare('SELECT stripe_invoice_id as id, total, currency, paid, hosted_invoice_url, created, status FROM invoices WHERE user_id = ? ORDER BY created DESC').all(req.session.userId);
  if (!sub) return res.json({ status: 'none', invoices: [] });
  res.json({ status: sub.status, planId: sub.plan_id, interval: sub.interval, currentPeriodEnd: sub.current_period_end, invoices });
});

// POST /api/subscribe/checkout
router.post('/subscribe/checkout', requireAuth, async (req, res) => {
  if (!stripe) return res.status(400).json({ ok: false, error: 'stripe_disabled' });
  const { planId, interval, coupon } = req.body || {};
  if (!planId || !interval) return res.status(400).json({ ok: false, error: 'missing_params' });
  const priceId = mapPrice(planId, interval);
  if (!priceId) return res.status(400).json({ ok: false, error: 'invalid_price' });
  let cust = db.prepare('SELECT stripe_customer_id FROM customers WHERE user_id = ?').get(req.session.userId);
  if (!cust) {
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.session.userId);
    const c = await stripe.customers.create({ email: user.email }, { timeout: 10000 });
    db.prepare('INSERT INTO customers (user_id, stripe_customer_id) VALUES (?, ?)').run(req.session.userId, c.id);
    cust = { stripe_customer_id: c.id };
  }
  const params = {
    mode: 'subscription',
    customer: cust.stripe_customer_id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: (process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:3000/subscribe') + '?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: (process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:3000/subscribe') + '?canceled=1'
  };
  if (coupon) params.discounts = [{ coupon }];
  try {
    const session = await stripe.checkout.sessions.create(params, { timeout: 10000 });
    res.json({ url: session.url });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'stripe_error', detail: e.message });
  }
});

// GET /api/subscribe/portal
router.get('/subscribe/portal', requireAuth, async (req, res) => {
  if (!stripe) return res.status(400).json({ ok: false, error: 'stripe_disabled' });
  const cust = db.prepare('SELECT stripe_customer_id FROM customers WHERE user_id = ?').get(req.session.userId);
  if (!cust) return res.status(404).json({ ok: false, error: 'no_customer' });
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: cust.stripe_customer_id,
      return_url: process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:3000/subscribe'
    }, { timeout: 10000 });
    res.json({ url: session.url });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'stripe_error', detail: e.message });
  }
});

// GET /api/subscribe/feature-gates
router.get('/subscribe/feature-gates', requireAuth, (req, res) => {
  const sub = db.prepare('SELECT plan_id, status FROM subscriptions WHERE user_id = ?').get(req.session.userId);
  const active = sub && sub.status === 'active';
  res.json({ pro: !!(active && (sub.plan_id === 'pro' || sub.plan_id === 'infinity')), infinity: !!(active && sub.plan_id === 'infinity') });
});

// Webhook handler
async function webhookHandler(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('stripe_disabled');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const userRow = db.prepare('SELECT user_id FROM customers WHERE stripe_customer_id = ?').get(session.customer);
        if (userRow) {
          db.prepare(`INSERT INTO subscriptions (user_id, stripe_subscription_id, plan_id, interval, status, current_period_end)
            VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET plan_id=excluded.plan_id, interval=excluded.interval, status=excluded.status, current_period_end=excluded.current_period_end`)
            .run(userRow.user_id, sub.id, sub.items.data[0].price.product, sub.items.data[0].price.recurring.interval, sub.status, sub.current_period_end);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userRow = db.prepare('SELECT user_id FROM customers WHERE stripe_customer_id = ?').get(sub.customer);
        if (userRow) {
          db.prepare(`INSERT INTO subscriptions (user_id, stripe_subscription_id, plan_id, interval, status, current_period_end)
            VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET plan_id=excluded.plan_id, interval=excluded.interval, status=excluded.status, current_period_end=excluded.current_period_end`)
            .run(userRow.user_id, sub.id, sub.items.data[0].price.product, sub.items.data[0].price.recurring.interval, sub.status, sub.current_period_end);
        }
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const inv = event.data.object;
        const userRow = db.prepare('SELECT user_id FROM customers WHERE stripe_customer_id = ?').get(inv.customer);
        if (userRow) {
          db.prepare(`INSERT INTO invoices (user_id, stripe_invoice_id, total, currency, paid, hosted_invoice_url, created, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(stripe_invoice_id) DO UPDATE SET total=excluded.total, paid=excluded.paid, hosted_invoice_url=excluded.hosted_invoice_url, status=excluded.status`)
            .run(userRow.user_id, inv.id, inv.total, inv.currency, inv.paid ? 1 : 0, inv.hosted_invoice_url || null, inv.created, inv.status);
        }
        break;
      }
      default:
        // ignore
    }
    console.log('[stripe] event', event.type);
    res.json({ received: true });
  } catch (e) {
    res.status(500).send('handler_error');
  }
}

module.exports = { router, webhookHandler };

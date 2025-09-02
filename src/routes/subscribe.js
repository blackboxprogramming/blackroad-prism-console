'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');
const { strictLimiter } = require('../rateLimiter');

const SUBSCRIPTIONS_ENABLED = process.env.SUBSCRIPTIONS_ENABLED !== 'false';

// GET /api/subscribe/health
// This endpoint remains available even when subscriptions are disabled.
router.get('/subscribe/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function ensureEnabled(req, res, next) {
  if (!SUBSCRIPTIONS_ENABLED) {
    return res.status(503).json({ message: 'subscriptions_disabled' });
  }
  next();
}

router.use('/subscribe', ensureEnabled);

const pendingSessions = new Map();

function randId() {
  return require('crypto').randomBytes(16).toString('hex');
}

// GET /api/subscribe/plans
router.get('/subscribe/plans', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, name, monthly_price_cents, yearly_price_cents, currency, features FROM plans WHERE active = 1 ORDER BY display_order'
    )
    .all();
  const plans = rows.map((r) => ({ ...r, features: JSON.parse(r.features || '[]') }));
  res.json(plans);
});

// GET /api/subscribe/status
router.get('/subscribe/status', requireAuth, (req, res) => {
  const sub = db
    .prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.session.userId);
  if (!sub) return res.json({ status: 'none' });

  const invoices = db
    .prepare(
      'SELECT id, amount_cents, currency, status, created_at, provider_ref FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    )
    .all(req.session.userId)
    .map((p) => ({
      id: p.id,
      total: p.amount_cents,
      currency: p.currency,
      status: p.status,
      hosted_invoice_url: null,
      created: p.created_at,
      provider_ref: p.provider_ref,
    }));

  res.json({
    status: sub.status,
    plan_id: sub.plan_id,
    billing_cycle: sub.billing_cycle,
    period_end: sub.period_end,
    renews: sub.renews,
    payment_method: sub.external_provider,
    next_invoice_estimate_cents: sub.price_cents,
    invoices,
  });
});

// POST /api/subscribe/checkout
router.post('/subscribe/checkout', strictLimiter, requireAuth, (req, res) => {
  const { plan, billing_cycle } = req.body || {};
  if (!plan || !billing_cycle) return res.status(400).json({ error: 'invalid_body' });
  const planRow = db.prepare('SELECT * FROM plans WHERE id = ? AND active = 1').get(plan);
  if (!planRow) return res.status(400).json({ error: 'invalid_plan' });
  const session_id = randId();
  pendingSessions.set(session_id, { user_id: req.session.userId, plan: planRow, billing_cycle });
  res.json({ checkout_url: `/subscribe/confirm?session_id=${session_id}` });
});

// POST /api/subscribe/confirm
router.post('/subscribe/confirm', strictLimiter, requireAuth, (req, res) => {
  const { session_id } = req.body || {};
  const info = pendingSessions.get(session_id);
  if (!info || info.user_id !== req.session.userId)
    return res.status(400).json({ error: 'invalid_session' });
  pendingSessions.delete(session_id);

  const now = Math.floor(Date.now() / 1000);
  const duration = info.billing_cycle === 'yearly' ? 365 * 24 * 3600 : 30 * 24 * 3600;
  const price =
    info.billing_cycle === 'yearly'
      ? info.plan.yearly_price_cents
      : info.plan.monthly_price_cents;
  const subId = randId();
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, period_start, period_end, renews, external_provider, external_sub_id, price_cents, currency, created_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, 1, 'fake', ?, ?, ?, ?)`
    ).run(
      subId,
      info.user_id,
      info.plan.id,
      info.billing_cycle,
      now,
      now + duration,
      session_id,
      price,
      info.plan.currency,
      now
    );
    db.prepare(
      `INSERT INTO payments (id, user_id, subscription_id, amount_cents, currency, method, status, txn_id, created_at)
       VALUES (?, ?, ?, ?, ?, 'fake', 'succeeded', ?, ?)`
    ).run(randId(), info.user_id, subId, price, info.plan.currency, session_id, now);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: 'db_error' });
  }
  res.json({ ok: true });
});

// POST /api/subscribe/cancel
router.post('/subscribe/cancel', strictLimiter, requireAuth, (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE subscriptions SET renews = 0, canceled_at = ? WHERE user_id = ? AND status = "active"').run(
    now,
    req.session.userId
  );
  res.json({ ok: true });
});

// POST /api/subscribe/resume
router.post('/subscribe/resume', strictLimiter, requireAuth, (req, res) => {
  db.prepare('UPDATE subscriptions SET renews = 1, canceled_at = NULL WHERE user_id = ? AND status = "active"').run(
    req.session.userId
  );
  res.json({ ok: true });
});

// Legacy placeholder routes
router.get('/subscribe/config', (_req, res) => {
  res.json({ testMode: true, publicKey: null });
});

router.get('/subscribe/portal', requireAuth, (_req, res) => {
  res.status(400).json({ ok: false, error: 'unsupported' });
});

router.get('/subscribe/feature-gates', requireAuth, (req, res) => {
  const sub = db
    .prepare('SELECT plan_id, status FROM subscriptions WHERE user_id = ?')
    .get(req.session.userId);
  const active = sub && sub.status === 'active';
  res.json({
    pro: !!(active && (sub.plan_id === 'pro' || sub.plan_id === 'infinity')),
    infinity: !!(active && sub.plan_id === 'infinity'),
  });
});

function webhookHandler(_req, res) {
  res.status(400).send('stripe_disabled');
}

module.exports = { router, webhookHandler };

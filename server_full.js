// FILE: /srv/blackroad-api/server_full.js
'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');

// Allow requiring .ts files as plain JS for lucidia brain modules
require.extensions['.ts'] = require.extensions['.js'];
const { PORT, NODE_ENV, ALLOWED_ORIGIN, LOG_DIR, SESSION_SECRET } = require('./src/config');

// Ensure log dir exists
if (LOG_DIR) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}
}

const app = express();
app.set('trust proxy', 1); // behind NGINX

// HTTP security headers
app.use(helmet());

// CORS (adjust as needed)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl / same-origin
    if (!ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// Sessions
if (!SESSION_SECRET || SESSION_SECRET === 'change-this-session-secret') {
  console.warn('[WARN] Weak or default SESSION_SECRET detected. Update your .env!');
}
app.use(cookieSession({
  name: 'brsid',
  secret: SESSION_SECRET || 'dev-session-secret',
  httpOnly: true,
  sameSite: 'lax',
  secure: NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
}));

// Rate limiting (global)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Initialize DB (auto-migrations on import)
const db = require('./src/db');

// SUBSCRIBE
const subRouter = express.Router();
const { requireAuth } = require('./src/auth');
const { v4: uuidv4 } = require('uuid');
const SUB_PROVIDER = process.env.SUB_PROVIDER || 'mock';
const SUB_WEBHOOK_SECRET = process.env.SUB_WEBHOOK_SECRET || 'change-me';

function createCheckoutSession({ user, plan }) {
  const paymentId = uuidv4();
  return {
    provider: SUB_PROVIDER,
    provider_ref: paymentId,
    checkout_url: `/subscribe/mock-pay?payment_id=${paymentId}`
  };
}

subRouter.get('/plans', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT plan_id, name, price_cents, currency, interval, features_json, rc_monthly_allowance, limits_json FROM plans WHERE active = 1'
    )
    .all();
  const plans = rows.map((r) => ({
    plan_id: r.plan_id,
    name: r.name,
    price_cents: r.price_cents,
    currency: r.currency,
    interval: r.interval,
    features: JSON.parse(r.features_json || '[]'),
    rc_monthly_allowance: r.rc_monthly_allowance,
    limits: JSON.parse(r.limits_json || '{}')
  }));
  res.json({ plans });
});

subRouter.get('/me', requireAuth, (req, res) => {
  const row = db
    .prepare(
      'SELECT s.plan_id, s.status, s.current_period_end, s.cancel_at_period_end, e.rc_monthly_allowance, e.rc_monthly_used, e.limits_json FROM subscriptions s LEFT JOIN entitlements e ON e.user_id = s.user_id WHERE s.user_id = ?'
    )
    .get(req.session.userId);
  if (!row) return res.json({ status: 'free' });
  res.json({
    status: row.status,
    plan_id: row.plan_id,
    current_period_end: row.current_period_end,
    cancel_at_period_end: !!row.cancel_at_period_end,
    entitlements: {
      rc_monthly_allowance: row.rc_monthly_allowance || 0,
      rc_monthly_used: row.rc_monthly_used || 0,
      limits: JSON.parse(row.limits_json || '{}')
    }
  });
});

subRouter.post('/checkout', requireAuth, (req, res) => {
  const { plan_id } = req.body || {};
  if (!plan_id) return res.status(400).json({ error: 'missing_plan', code: 'missing_plan' });
  const plan = db
    .prepare('SELECT plan_id, price_cents, currency FROM plans WHERE plan_id = ? AND active = 1')
    .get(plan_id);
  if (!plan) return res.status(400).json({ error: 'invalid_plan', code: 'invalid_plan' });
  const { provider, provider_ref, checkout_url } = createCheckoutSession({ user: req.session.userId, plan });
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO payments (id, user_id, plan_id, amount_cents, currency, provider, provider_ref, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?)`
  ).run(provider_ref, req.session.userId, plan.plan_id, plan.price_cents, plan.currency, provider, provider_ref, now, now);
  res.json({ checkout_url });
});

subRouter.post('/mock/pay', requireAuth, (req, res) => {
  const { payment_id, success } = req.body || {};
  const pay = db
    .prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?')
    .get(payment_id, req.session.userId);
  if (!pay) return res.status(400).json({ error: 'invalid_payment' });
  const now = Math.floor(Date.now() / 1000);
  const status = success ? 'paid' : 'failed';
  db.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?').run(status, now, payment_id);
  if (success) {
    const subId = uuidv4();
    const periodStart = now;
    const periodEnd = now + 30 * 24 * 60 * 60;
    db.prepare(
      `INSERT OR REPLACE INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, 0, ?, ?)`
    ).run(subId, req.session.userId, pay.plan_id, periodStart, periodEnd, now, now);
    const plan = db
      .prepare('SELECT rc_monthly_allowance, limits_json FROM plans WHERE plan_id = ?')
      .get(pay.plan_id);
    db.prepare(
      `INSERT INTO entitlements (user_id, plan_id, rc_monthly_allowance, rc_monthly_used, limits_json, refreshed_at)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET plan_id=excluded.plan_id, rc_monthly_allowance=excluded.rc_monthly_allowance, rc_monthly_used=0, limits_json=excluded.limits_json, refreshed_at=excluded.refreshed_at`
    ).run(req.session.userId, pay.plan_id, plan.rc_monthly_allowance, plan.limits_json, now);
  }
  res.json({ ok: true });
});

subRouter.post('/cancel', requireAuth, (req, res) => {
  db.prepare('UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = strftime("%s","now") WHERE user_id = ?').run(
    req.session.userId
  );
  res.json({ ok: true });
});

subRouter.post('/resume', requireAuth, (req, res) => {
  db.prepare('UPDATE subscriptions SET cancel_at_period_end = 0, updated_at = strftime("%s","now") WHERE user_id = ?').run(
    req.session.userId
  );
  res.json({ ok: true });
});

function handleWebhook(req, res) {
  const sig = req.get('X-Subscribe-Signature');
  const payload = JSON.stringify(req.body || {});
  const expected = require('crypto').createHmac('sha256', SUB_WEBHOOK_SECRET).update(payload).digest('base64');
  if (sig !== expected) return res.status(401).json({ error: 'invalid_signature' });
  const now = Math.floor(Date.now() / 1000);
  db.prepare('INSERT INTO webhook_log (id, provider, event_type, payload_json, received_at) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    SUB_PROVIDER,
    req.body.event_type || 'unknown',
    payload,
    now
  );
  res.json({ received: true });
}

app.post('/api/subscribe/webhook', handleWebhook);
app.use('/api/subscribe', subRouter);

// ROADCOIN
const rcRouter = express.Router();

rcRouter.post('/hold', requireAuth, (req, res) => {
  const { amount, module, ref_type, ref_id } = req.body || {};
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'invalid_amount', code: 'invalid_amount' });
  }
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO rc_holds (id, user_id, amount, module, ref_type, ref_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'held', ?, ?)`
  ).run(id, req.session.userId, amount, module || null, ref_type || null, ref_id || null, now, now);
  res.json({ hold_id: id });
});

rcRouter.post('/release', requireAuth, (req, res) => {
  const { hold_id } = req.body || {};
  const hold = db
    .prepare('SELECT * FROM rc_holds WHERE id = ? AND user_id = ? AND status = "held"')
    .get(hold_id, req.session.userId);
  if (!hold) return res.status(400).json({ error: 'invalid_hold', code: 'invalid_hold' });
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE rc_holds SET status = ?, updated_at = ? WHERE id = ?').run('released', now, hold_id);
  res.json({ ok: true });
});

rcRouter.post('/capture', requireAuth, (req, res) => {
  const { hold_id } = req.body || {};
  const hold = db
    .prepare('SELECT * FROM rc_holds WHERE id = ? AND user_id = ? AND status = "held"')
    .get(hold_id, req.session.userId);
  if (!hold) return res.status(400).json({ error: 'invalid_hold', code: 'invalid_hold' });
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE rc_holds SET status = ?, updated_at = ? WHERE id = ?').run('captured', now, hold_id);
  db.prepare(
    `INSERT INTO rc_ledger (id, user_id, delta, source, module, ref_type, ref_id, memo, created_at, created_by)
     VALUES (?, ?, ?, 'job', ?, ?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    req.session.userId,
    -hold.amount,
    hold.module || null,
    hold.ref_type || null,
    hold.ref_id || null,
    null,
    now,
    req.session.userId
  );
  res.json({ ok: true });
});

rcRouter.get('/prices', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT key, amount FROM rc_prices WHERE active = 1').all();
  const prices = {};
  for (const r of rows) prices[r.key] = r.amount;
  res.json({ prices });
});

app.use('/api/rc', rcRouter);
// Routes
const apiRouter = require('./src/routes');
app.use('/api', apiRouter);

// MCI routes
const mciRouter = require('./srv/blackroad-api/mci/routes/mci.routes');
app.use('/api/mci', mciRouter);
// Lucidia Brain routes
if (process.env.ENABLE_LUCIDIA_BRAIN !== '0') {
  app.use('/api/lucidia/brain', require('./routes/lucidia-brain'));
}

// Root
app.get('/', (req, res) => {
  res.status(200).json({ ok: true, service: 'blackroad-api', env: NODE_ENV || 'dev' });
});

// HTTP server + Socket.IO
const server = http.createServer(app);
const { setupSockets } = require('./src/socket');
setupSockets(server);

server.listen(PORT, () => {
  console.log(`[blackroad-api] listening on port ${PORT} (env: ${NODE_ENV})`);
});

'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');
const { strictLimiter } = require('../rateLimiter');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const wallet = db.prepare('SELECT * FROM wallets WHERE owner_type = "user" AND owner_id = ?').get(userId);
  if (!wallet) return res.status(404).json({ ok: false, error: 'wallet_not_found' });
  const txs = db.prepare(`
    SELECT t.* FROM transactions t
    WHERE t.wallet_from = ? OR t.wallet_to = ?
    ORDER BY t.created_at DESC LIMIT 200
  `).all(wallet.id, wallet.id);
  res.json({ ok: true, wallet, transactions: txs });
});

router.get('/balance', requireAuth, (req, res) => {
  const userId = req.session.userId;
  let wallet = db
    .prepare('SELECT * FROM wallets WHERE owner_type = "user" AND owner_id = ?')
    .get(userId);
  if (!wallet) {
    const walletId = cryptoRandomId();
    db.prepare(
      'INSERT INTO wallets (id, owner_type, owner_id, balance) VALUES (?, "user", ?, 0)'
    ).run(walletId, userId);
    wallet = { id: walletId, balance: 0 };
  }
  res.json({ balance_rc: wallet.balance });
});

router.post('/pay', strictLimiter, requireAuth, (req, res) => {
  const { plan, billing_cycle } = req.body || {};
  if (!plan || !billing_cycle) return res.status(400).json({ error: 'invalid_body' });

  const planRow = db
    .prepare('SELECT * FROM plans WHERE id = ? AND active = 1')
    .get(plan);
  if (!planRow) return res.status(400).json({ error: 'invalid_plan' });

  const userId = req.session.userId;
  let wallet = db
    .prepare('SELECT * FROM wallets WHERE owner_type = "user" AND owner_id = ?')
    .get(userId);
  if (!wallet) {
    const walletId = cryptoRandomId();
    db.prepare(
      'INSERT INTO wallets (id, owner_type, owner_id, balance) VALUES (?, "user", ?, 0)'
    ).run(walletId, userId);
    wallet = { id: walletId, balance: 0 };
  }

  const price =
    billing_cycle === 'yearly'
      ? planRow.yearly_price_cents
      : planRow.monthly_price_cents;
  const costRc = Math.round(price / 100);
  if (wallet.balance < costRc)
    return res.status(400).json({ error: 'insufficient_funds' });

  const now = Math.floor(Date.now() / 1000);
  const duration = billing_cycle === 'yearly' ? 365 * 24 * 3600 : 30 * 24 * 3600;
  const subId = cryptoRandomId();

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(costRc, wallet.id);
    db.prepare(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, period_start, period_end, renews, external_provider, external_sub_id, price_cents, currency, created_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, 1, 'roadcoin', NULL, ?, ?, ?)`
    ).run(
      subId,
      userId,
      planRow.id,
      billing_cycle,
      now,
      now + duration,
      price,
      planRow.currency,
      now
    );
    db.prepare(
      `INSERT INTO payments (id, user_id, subscription_id, amount_cents, currency, method, status, txn_id, created_at)
       VALUES (?, ?, ?, ?, ?, 'roadcoin', 'succeeded', ?, ?)`
    ).run(cryptoRandomId(), userId, subId, price, planRow.currency, cryptoRandomId(), now);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: 'db_error' });
  }

  res.json({ ok: true });
});

router.post('/mint', requireAdmin, (req, res) => {
  const { toUserId, amount, memo } = req.body || {};
  if (!toUserId || !amount || amount <= 0) return res.status(400).json({ ok: false, error: 'invalid_fields' });
  const toWallet = db.prepare('SELECT * FROM wallets WHERE owner_type = "user" AND owner_id = ?').get(toUserId);
  if (!toWallet) return res.status(404).json({ ok: false, error: 'to_wallet_not_found' });

  // System wallet (null from)
  const txId = cryptoRandomId();
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(amount, toWallet.id);
    db.prepare(`
      INSERT INTO transactions (id, wallet_from, wallet_to, amount, memo)
      VALUES (?, NULL, ?, ?, ?)
    `).run(txId, toWallet.id, amount, memo || 'mint');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  res.json({ ok: true, txId });
});

router.post('/transfer', requireAuth, (req, res) => {
  const { toUserId, amount, memo } = req.body || {};
  if (!toUserId || !amount || amount <= 0) return res.status(400).json({ ok: false, error: 'invalid_fields' });
  const fromWallet = db.prepare('SELECT * FROM wallets WHERE owner_type = "user" AND owner_id = ?').get(req.session.userId);
  const toWallet = db.prepare('SELECT * FROM wallets WHERE owner_type = "user" AND owner_id = ?').get(toUserId);
  if (!fromWallet || !toWallet) return res.status(404).json({ ok: false, error: 'wallet_not_found' });
  if (fromWallet.balance < amount) return res.status(400).json({ ok: false, error: 'insufficient_funds' });

  const txId = cryptoRandomId();
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(amount, fromWallet.id);
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(amount, toWallet.id);
    db.prepare(`
      INSERT INTO transactions (id, wallet_from, wallet_to, amount, memo)
      VALUES (?, ?, ?, ?, ?)
    `).run(txId, fromWallet.id, toWallet.id, amount, memo || 'transfer');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  res.json({ ok: true, txId });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;

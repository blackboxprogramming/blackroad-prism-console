-- FILE: /srv/blackroad-api/db/migrations/0002_subscriptions.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INT,
  monthly_price_cents INT NOT NULL,
  yearly_price_cents INT NOT NULL,
  currency TEXT DEFAULT 'USD',
  features TEXT,
  active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  period_start INTEGER,
  period_end INTEGER,
  renews INT DEFAULT 1,
  external_provider TEXT,
  external_sub_id TEXT,
  price_cents INT,
  currency TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  canceled_at INTEGER
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT,
  amount_cents INT,
  currency TEXT,
  method TEXT,
  status TEXT,
  txn_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  meta TEXT
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  percent_off INT,
  active INT DEFAULT 1,
  max_redemptions INT,
  times_redeemed INT DEFAULT 0,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(active);

-- Seed default plans
INSERT OR IGNORE INTO plans (id,name,display_order,monthly_price_cents,yearly_price_cents,currency,features) VALUES
('creator','Creator',1,900,8640,'USD','["Feature A","Feature B","Feature C","Feature D","Feature E","Feature F"]'),
('pro','Pro',2,2900,27840,'USD','["Feature A","Feature B","Feature C","Feature D","Feature E","Feature F"]'),
('infinity','Infinity',3,9900,95040,'USD','["Feature A","Feature B","Feature C","Feature D","Feature E","Feature F"]');

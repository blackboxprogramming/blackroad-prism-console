-- Stripe raw ingestion tables for PRISM
CREATE TABLE IF NOT EXISTS integration_sources (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_sources_kind ON integration_sources(kind);

CREATE TABLE IF NOT EXISTS raw_stripe_customers (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  source_id UUID NOT NULL REFERENCES integration_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS raw_stripe_subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  source_id UUID NOT NULL REFERENCES integration_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rss_status ON raw_stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_rss_source ON raw_stripe_subscriptions(source_id);

CREATE TABLE IF NOT EXISTS raw_stripe_subscription_items (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  interval TEXT NOT NULL,
  interval_count INT NOT NULL,
  unit_amount BIGINT,
  quantity INT,
  payload JSONB NOT NULL,
  source_id UUID NOT NULL REFERENCES integration_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rssi_subscription ON raw_stripe_subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_rssi_source ON raw_stripe_subscription_items(source_id);

CREATE TABLE IF NOT EXISTS raw_stripe_charges (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL,
  paid BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  source_id UUID NOT NULL REFERENCES integration_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rsc_created ON raw_stripe_charges(created_at);
CREATE INDEX IF NOT EXISTS idx_rsc_source ON raw_stripe_charges(source_id);

CREATE TABLE IF NOT EXISTS stripe_sync_state (
  source_id UUID PRIMARY KEY REFERENCES integration_sources(id) ON DELETE CASCADE,
  last_charge_ts TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01',
  last_sub_updated_ts TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01'
);

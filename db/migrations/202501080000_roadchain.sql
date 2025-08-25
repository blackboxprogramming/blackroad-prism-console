-- RoadChain tables
CREATE TABLE IF NOT EXISTS roadchain_accounts (
  user_id TEXT PRIMARY KEY,
  evm_address TEXT UNIQUE,
  siwe_nonce TEXT,
  linked_at INTEGER,
  last_seen INTEGER
);
CREATE INDEX IF NOT EXISTS idx_roadchain_accounts_evm_address ON roadchain_accounts (evm_address);

CREATE TABLE IF NOT EXISTS roadchain_limits (
  user_id TEXT PRIMARY KEY,
  month_key TEXT,
  proofs_published INTEGER DEFAULT 0,
  manifests_published INTEGER DEFAULT 0,
  UNIQUE(user_id, month_key)
);

CREATE TABLE IF NOT EXISTS roadchain_receipts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  kind TEXT CHECK(kind IN ('usage','manifest','badge')),
  ref_hash TEXT,
  value INTEGER,
  meta_uri TEXT,
  sig_algo TEXT,
  sig_value TEXT,
  chain_id INTEGER,
  status TEXT CHECK(status IN ('pending','confirmed','failed')) DEFAULT 'pending',
  external_id TEXT,
  explorer_url TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_roadchain_receipts_user ON roadchain_receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_roadchain_receipts_kind ON roadchain_receipts (kind);
CREATE INDEX IF NOT EXISTS idx_roadchain_receipts_status ON roadchain_receipts (status);

CREATE TABLE IF NOT EXISTS roadchain_merkle_roots (
  day_key TEXT PRIMARY KEY,
  root TEXT,
  leaf_count INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS roadchain_webhook_log (
  id TEXT PRIMARY KEY,
  provider TEXT,
  event_type TEXT,
  payload_json TEXT,
  received_at INTEGER
);

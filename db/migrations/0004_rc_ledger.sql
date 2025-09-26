-- FILE: /srv/blackroad-api/db/migrations/0004_rc_ledger.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rc_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  source TEXT CHECK(source IN ('allowance','purchase','airdrop','adjust','job','refund','transfer_in','transfer_out','faucet')),
  module TEXT,
  ref_type TEXT,
  ref_id TEXT,
  memo TEXT,
  created_at INTEGER,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_rc_ledger_user ON rc_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_ledger_created ON rc_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_rc_ledger_source ON rc_ledger(source);

CREATE TABLE IF NOT EXISTS rc_holds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  module TEXT,
  ref_type TEXT,
  ref_id TEXT,
  status TEXT CHECK(status IN ('held','captured','released','canceled')) DEFAULT 'held',
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_rc_holds_user ON rc_holds(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_holds_status ON rc_holds(status);
CREATE INDEX IF NOT EXISTS idx_rc_holds_ref ON rc_holds(ref_id);

CREATE TABLE IF NOT EXISTS rc_prices (
  key TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO rc_prices (key, amount, active) VALUES
  ('tts_per_10s',1,1),
  ('image_gen',2,1),
  ('render_draft_base',10,1),
  ('render_draft_per_scene',1,1),
  ('render_final_base',30,1),
  ('render_final_per_scene',3,1),
  ('llm_token_1k',1,1),
  ('storage_per_mb',0,1);

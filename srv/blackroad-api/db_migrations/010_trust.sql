PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS trust_identities (
  did TEXT PRIMARY KEY,
  label TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS trust_edges (
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  weight REAL NOT NULL,        -- [-1..1], >0 trust, <0 distrust
  evidence_cid TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (src, dst)
);

CREATE TABLE IF NOT EXISTS trust_lenses (
  lens_id TEXT PRIMARY KEY,
  label   TEXT,
  lambda  REAL NOT NULL DEFAULT 0.6,     -- blend: score = λ*Love + (1-λ)*Trust
  seeds_json   TEXT,                     -- seed DIDs with priors, e.g. {"did:key:…":1}
  love_override_json TEXT,               -- override weights for Love (optional)
  created_at INTEGER NOT NULL
);

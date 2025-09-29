CREATE TABLE IF NOT EXISTS error_contradictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  req_id TEXT,
  user_id TEXT,
  route TEXT,
  method TEXT,
  state INTEGER CHECK(state IN (-1,0,1)) NOT NULL,
  resolved INTEGER DEFAULT 0,
  resolved_ts DATETIME,
  severity TEXT,
  code TEXT,
  message TEXT,
  stack TEXT,
  payload_hash TEXT,
  contradiction_hint TEXT,
  resolver_note TEXT,
  resolver_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_err_unresolved ON error_contradictions(resolved, state);
CREATE INDEX IF NOT EXISTS idx_err_route ON error_contradictions(route, method);

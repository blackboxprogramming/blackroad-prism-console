-- Initializes MCI cache table
CREATE TABLE IF NOT EXISTS mci_cache (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

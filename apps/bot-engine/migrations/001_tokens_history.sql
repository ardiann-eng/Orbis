-- 001_tokens_history.sql
CREATE TABLE IF NOT EXISTS tokens_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ca TEXT NOT NULL UNIQUE,
  name TEXT,
  symbol TEXT,
  image_hash TEXT,
  creator_wallet TEXT,
  created_at INTEGER NOT NULL,
  first_seen_at INTEGER NOT NULL,
  market_cap_usd REAL,
  liquidity_usd REAL,
  volume_24h REAL,
  holder_count INTEGER,
  is_pump_fun INTEGER DEFAULT 1,
  metadata TEXT,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tokens_ca ON tokens_history(ca);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON tokens_history(created_at);

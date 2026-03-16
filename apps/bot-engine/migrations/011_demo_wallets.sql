-- 011_demo_wallets.sql
-- Virtual demo wallet per user for DEMO trading mode

CREATE TABLE IF NOT EXISTS demo_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  virtual_balance REAL DEFAULT 2.0,
  initial_balance REAL DEFAULT 2.0,
  locked_in_positions REAL DEFAULT 0,
  total_realized_pnl REAL DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  reset_count INTEGER DEFAULT 0,
  last_reset_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  updated_at INTEGER
);


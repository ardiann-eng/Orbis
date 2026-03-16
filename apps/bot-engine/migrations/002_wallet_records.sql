-- 002_wallet_records.sql
CREATE TABLE IF NOT EXISTS wallet_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  main_wallet TEXT NOT NULL,
  trading_wallet TEXT,
  encrypted_keypair TEXT,
  encryption_iv TEXT,
  created_at INTEGER NOT NULL,
  last_active INTEGER
);

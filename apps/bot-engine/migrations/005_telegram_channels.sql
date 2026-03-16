-- 005_telegram_channels.sql
CREATE TABLE IF NOT EXISTS telegram_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT,
  channel_username TEXT,
  is_active INTEGER DEFAULT 1,
  weight REAL DEFAULT 1.0,
  added_at INTEGER NOT NULL
);

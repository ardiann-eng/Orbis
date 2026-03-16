-- 006_ca_mentions_log.sql
CREATE TABLE IF NOT EXISTS ca_mentions_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ca TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT,
  mentioned_at INTEGER NOT NULL,
  context TEXT
);
CREATE INDEX IF NOT EXISTS idx_mentions_ca ON ca_mentions_log(ca);
CREATE INDEX IF NOT EXISTS idx_mentions_at ON ca_mentions_log(mentioned_at);

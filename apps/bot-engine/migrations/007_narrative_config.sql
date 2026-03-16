-- 007_narrative_config.sql
CREATE TABLE IF NOT EXISTS narrative_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  category TEXT,
  status TEXT DEFAULT 'active',
  multiplier REAL DEFAULT 1.0,
  created_at INTEGER NOT NULL
);

-- Seed with default narratives
INSERT OR IGNORE INTO narrative_config (keyword, category, status, multiplier, created_at) VALUES
  ('ai', 'tech', 'active', 1.20, unixepoch() * 1000),
  ('agent', 'tech', 'active', 1.20, unixepoch() * 1000),
  ('gpt', 'tech', 'active', 1.20, unixepoch() * 1000),
  ('dog', 'animal', 'active', 1.15, unixepoch() * 1000),
  ('cat', 'animal', 'active', 1.15, unixepoch() * 1000),
  ('animal', 'animal', 'active', 1.15, unixepoch() * 1000),
  ('game', 'entertainment', 'active', 1.05, unixepoch() * 1000),
  ('play', 'entertainment', 'active', 1.05, unixepoch() * 1000),
  ('chess', 'entertainment', 'active', 1.05, unixepoch() * 1000),
  ('sport', 'entertainment', 'active', 1.05, unixepoch() * 1000),
  ('president', 'politics', 'active', 1.08, unixepoch() * 1000),
  ('trump', 'politics', 'active', 1.08, unixepoch() * 1000),
  ('nasa', 'space', 'active', 0.80, unixepoch() * 1000),
  ('space', 'space', 'active', 0.80, unixepoch() * 1000),
  ('food', 'food', 'active', 0.75, unixepoch() * 1000),
  ('pizza', 'food', 'active', 0.75, unixepoch() * 1000),
  ('burger', 'food', 'active', 0.75, unixepoch() * 1000),
  ('coffee', 'food', 'active', 0.75, unixepoch() * 1000);

-- 004_decisions_log.sql
CREATE TABLE IF NOT EXISTS decisions_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ca TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  confidence_score REAL,
  logic_triggered TEXT,
  warning_flags TEXT,
  executed_at INTEGER NOT NULL,
  tx_hash TEXT,
  price_usd REAL,
  amount_sol REAL
);
CREATE INDEX IF NOT EXISTS idx_decisions_ca ON decisions_log(ca);
CREATE INDEX IF NOT EXISTS idx_decisions_executed ON decisions_log(executed_at);

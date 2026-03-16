-- 009_bot_config.sql
CREATE TABLE IF NOT EXISTS bot_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  logic1_enabled INTEGER DEFAULT 1,
  logic2_enabled INTEGER DEFAULT 1,
  logic3_enabled INTEGER DEFAULT 1,
  min_confidence_score REAL DEFAULT 0.65,
  min_unique_channels INTEGER DEFAULT 3,
  max_trades_per_day INTEGER DEFAULT 10,
  max_exposure_sol REAL DEFAULT 1.0,
  drawdown_limit_pct REAL DEFAULT 0.10,
  stop_loss_pct REAL DEFAULT 0.15,
  take_profit_pct REAL DEFAULT 0.30,
  min_liquidity_usd REAL DEFAULT 5000,
  min_holder_count INTEGER DEFAULT 50,
  max_top10_holder_pct REAL DEFAULT 0.80,
  blacklisted_tokens TEXT DEFAULT '[]',
  is_bot_active INTEGER DEFAULT 0,
  updated_at INTEGER
);

-- 008_portfolio_state.sql
CREATE TABLE IF NOT EXISTS portfolio_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ca TEXT NOT NULL,
  status TEXT NOT NULL,
  entry_price REAL,
  entry_amount_sol REAL,
  entry_tx TEXT,
  current_price REAL,
  unrealized_pnl REAL,
  realized_pnl REAL,
  stop_loss_price REAL,
  take_profit_price REAL,
  cascade_stop_count INTEGER DEFAULT 0,
  opened_at INTEGER NOT NULL,
  closed_at INTEGER,
  close_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_state(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_status ON portfolio_state(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_status ON portfolio_state(user_id, status);

-- 012_demo_positions.sql
-- Demo positions for virtual trading (DEMO mode)

CREATE TABLE IF NOT EXISTS demo_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  token_name TEXT,
  entry_price REAL NOT NULL,
  entry_time INTEGER NOT NULL,
  size_sol REAL NOT NULL,
  trigger_logic TEXT,
  confidence_score REAL,
  tp1_percent REAL DEFAULT 30,
  tp2_percent REAL DEFAULT 80,
  sl_percent REAL DEFAULT 20,
  time_exit_hours REAL DEFAULT 4,
  status TEXT DEFAULT 'OPEN',
  current_price REAL,
  peak_price REAL,
  trailing_stop_price REAL,
  executed_levels TEXT DEFAULT '[]',
  remaining_percent REAL DEFAULT 100,
  realized_pnl_sol REAL DEFAULT 0,
  unrealized_pnl_sol REAL DEFAULT 0,
  close_price REAL,
  close_time INTEGER,
  close_reason TEXT,
  simulated_slippage REAL,
  simulated_fee REAL,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
);


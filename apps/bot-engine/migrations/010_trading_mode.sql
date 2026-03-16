-- 010_trading_mode.sql
-- Add trading_mode column to bot_config to track DEMO vs REAL mode.

ALTER TABLE bot_config
ADD COLUMN IF NOT EXISTS trading_mode TEXT DEFAULT 'DEMO';


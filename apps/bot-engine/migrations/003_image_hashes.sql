-- 003_image_hashes.sql
CREATE TABLE IF NOT EXISTS image_hashes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ca TEXT NOT NULL,
  phash TEXT NOT NULL,
  dhash TEXT,
  original_url TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hashes_phash ON image_hashes(phash);

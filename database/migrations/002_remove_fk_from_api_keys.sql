-- Migration: Remove FOREIGN KEY constraints from api_keys
-- Reason: user_id stores Auth Firebase uid, not megan-db.users.id

CREATE TABLE api_keys_new (
  key TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  rate_limit INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  last_used_at INTEGER,
  expires_at INTEGER,
  environment TEXT DEFAULT 'production'
);

INSERT INTO api_keys_new (key, user_id, name, rate_limit, active, created_by, created_at, last_used_at, expires_at, environment)
SELECT key, user_id, name, rate_limit, active, created_by, created_at, last_used_at, expires_at, environment FROM api_keys;

DROP TABLE api_keys;
ALTER TABLE api_keys_new RENAME TO api_keys;

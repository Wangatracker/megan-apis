-- Megan APIs D1 Database Schema

-- API Reviews Table
CREATE TABLE IF NOT EXISTS api_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_name TEXT DEFAULT 'anonymous',
  api_key TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- API Likes Table
CREATE TABLE IF NOT EXISTS api_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  api_key TEXT,
  user_name TEXT DEFAULT 'anonymous',
  liked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(endpoint, api_key)
);

-- API Usage Tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  api_key TEXT,
  requested_ip TEXT,
  response_time_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Error Reports
CREATE TABLE IF NOT EXISTS error_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details TEXT,
  api_key TEXT,
  user_name TEXT DEFAULT 'anonymous',
  reported_at TEXT DEFAULT (datetime('now')),
  resolved BOOLEAN DEFAULT 0,
  resolved_at TEXT
);

-- Megan AI Conversations (optional)
CREATE TABLE IF NOT EXISTS megan_ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  user_input TEXT NOT NULL,
  ai_response TEXT,
  model_used TEXT,
  fallback_used BOOLEAN DEFAULT 0,
  api_key TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- API Identity (for API ID generation)
CREATE TABLE IF NOT EXISTS api_identity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_id TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_endpoint ON api_reviews(endpoint);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON api_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_likes_endpoint ON api_likes(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_errors_endpoint ON error_reports(endpoint);
CREATE INDEX IF NOT EXISTS idx_errors_unresolved ON error_reports(resolved);

-- Insert initial API ID
INSERT OR IGNORE INTO api_identity (api_id) VALUES ('megan-apis-v3');

-- Insert some initial reviews for popular endpoints
INSERT OR IGNORE INTO api_reviews (endpoint, rating, comment, user_name) VALUES
('/api/download/tiktok', 5, 'Works great! Download speed is fast.', 'anonymous'),
('/api/ai/chat/claude', 5, 'Best free AI chat API!', 'anonymous'),
('/api/v2/tools/translate', 4, 'Accurate translations, quick response.', 'anonymous'),
('/api/stalk/github', 5, 'Great for developer OSINT.', 'anonymous'),
('/api/v2/sticker/stickerly-search', 4, 'Found the sticker I wanted easily.', 'anonymous');

-- Insert some likes for popular endpoints
INSERT OR IGNORE INTO api_likes (endpoint) VALUES
('/api/download/tiktok'),
('/api/ai/chat/claude'),
('/api/v2/tools/translate'),
('/api/stalk/github'),
('/api/v2/sticker/stickerly-search');

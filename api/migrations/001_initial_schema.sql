CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  seen_how_to BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  scripture TEXT,
  scripture_text TEXT,
  pray_read TEXT,
  prr_checkboxes JSONB DEFAULT '[false, false, false]',
  reflection_types JSONB DEFAULT '[false, false, false, false, false, false, false, false, false]',
  god_about_himself TEXT,
  god_about_us TEXT,
  god_told_me_personally TEXT,
  my_response TEXT,
  takeaway TEXT,
  emailed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entries_email_due
ON entries (created_at)
WHERE emailed_at IS NULL;

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  week TEXT NOT NULL,
  entry TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('praise', 'others', 'self')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_week
ON journal_entries (user_id, week);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

// src/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// pool.query(`
// DROP TABLE IF EXISTS entries CASCADE;
// `);

async function initializeSchema() {
  await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`);

  await pool.query(`
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
`);

  await pool.query(`
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMP;
`);

  await pool.query(`
CREATE INDEX IF NOT EXISTS idx_entries_email_due
ON entries (created_at)
WHERE emailed_at IS NULL;
`);

  await pool.query(`
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);
`);

  await pool.query(`
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`);
}

initializeSchema().catch((error) => {
  console.error("Database schema initialization failed:", error);
  process.exit(1);
});

module.exports = pool;
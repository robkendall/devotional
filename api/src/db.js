// src/db.js
const { Pool } = require('pg');

function shouldUseSsl() {
  const sslMode = String(process.env.PGSSLMODE || "").toLowerCase();
  const explicit = String(process.env.DATABASE_SSL || "").toLowerCase();

  if (sslMode === "require" || explicit === "true") {
    return true;
  }

  const databaseUrl = String(process.env.DATABASE_URL || "");
  return databaseUrl.includes("sslmode=require");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
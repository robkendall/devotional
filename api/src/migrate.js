require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("./db");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

async function ensureMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);
}

function getMigrationFiles() {
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((name) => name.endsWith(".sql"))
        .sort();
}

async function getAppliedMigrations() {
    const result = await pool.query("SELECT filename FROM schema_migrations");
    return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(filename) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, "utf8").trim();

    if (!sql) return;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1)",
            [filename]
        );
        await client.query("COMMIT");
        console.log(`Applied migration: ${filename}`);
    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed (${filename}): ${error.message}`);
    } finally {
        client.release();
    }
}

async function runMigrations() {
    await ensureMigrationsTable();
    const files = getMigrationFiles();
    const applied = await getAppliedMigrations();

    for (const filename of files) {
        if (applied.has(filename)) continue;
        await applyMigration(filename);
    }

    console.log("Database migrations complete.");
}

runMigrations()
    .catch((error) => {
        console.error(error.message);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });

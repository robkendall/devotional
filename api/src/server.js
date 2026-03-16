// src/server.js
require("dotenv").config();

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require('./db');
const requireAuth = require("./middleware/auth");

const EMAIL_DELAY_HOURS = 4;
const EMAIL_CHECK_INTERVAL_MS = Number(process.env.EMAIL_CHECK_INTERVAL_MS || 60000);
const PORT = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET;

function logInfo(event, details) {
    console.log(JSON.stringify({ level: "info", event, ...details }));
}

function logError(event, details) {
    console.error(JSON.stringify({ level: "error", event, ...details }));
}

if (!SESSION_SECRET && IS_PRODUCTION) {
    throw new Error("SESSION_SECRET is required in production.");
}

function normalizeBooleanArray(value) {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
}

function buildEntryEmailText(entry) {
    return [
        `Scripture: ${entry.scripture || "N/A"}`,
        `Takeaway: ${entry.takeaway || "N/A"}`,
    ].join("\n");
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function hasSelectedOption(value) {
    const normalized = normalizeBooleanArray(value);
    return normalized.some(Boolean);
}

function hasAllSelectedOptions(value) {
    const normalized = normalizeBooleanArray(value);
    return normalized.length > 0 && normalized.every(Boolean);
}

function isValidJournalType(value) {
    return value === "praise" || value === "others" || value === "self";
}

function getTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    if (!smtpHost) {
        return null;
    }

    const transportConfig = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
    };

    if (smtpUser && smtpPass) {
        transportConfig.auth = {
            user: smtpUser,
            pass: smtpPass,
        };
    }
    return nodemailer.createTransport(transportConfig);
}

async function sendDueEntryEmails() {
    const transporter = getTransporter();

    if (!transporter) {
        return;
    }

    try {
        const dueEntries = await pool.query(
            `SELECT e.*, u.email AS user_email
             FROM entries e
             JOIN users u ON u.id = e.user_id
             WHERE e.emailed_at IS NULL
               AND e.created_at <= NOW() - INTERVAL '${EMAIL_DELAY_HOURS} hours'
             ORDER BY e.created_at ASC
             LIMIT 25`
        );

        if (dueEntries.rows.length === 0) {
            return;
        }

        const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@devotional.local";

        for (const entry of dueEntries.rows) {
            try {
                console.log('Emailing entry:', entry.id, 'to', entry.user_email);
                await transporter.sendMail({
                    from: smtpFrom,
                    to: entry.user_email,
                    subject: `Reading and Reflecting - ${entry.date}`,
                    text: buildEntryEmailText(entry),
                });

                await pool.query(
                    "UPDATE entries SET emailed_at = NOW() WHERE id = $1",
                    [entry.id]
                );
            } catch (entryError) {
                console.error(`Failed to email entry ${entry.id}:`, entryError);
            }
        }
    } catch (error) {
        console.error("Email scheduler error:", error);
    }
}

function startEmailScheduler() {
    // Run shortly after boot to catch overdue unsent entries.
    setTimeout(() => {
        sendDueEntryEmails();
    }, 5000);

    setInterval(() => {
        sendDueEntryEmails();
    }, EMAIL_CHECK_INTERVAL_MS);
}

const app = express();
app.set("trust proxy", true);

app.use(helmet({
    contentSecurityPolicy: false,
}));

const corsOrigins = String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

if (corsOrigins.length > 0) {
    app.use(cors({
        origin: corsOrigins,
        credentials: true,
    }));
}

app.use(express.json());

app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
        logInfo("request", {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - startedAt,
        });
    });
    next();
});

const authLimiter = rateLimit({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: "session"
    }),
    secret: SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: process.env.SESSION_COOKIE_SAMESITE || "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.get("/healthz", (req, res) => {
    res.status(200).json({ ok: true });
});

app.get("/readyz", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        return res.status(200).json({ ok: true });
    } catch (error) {
        return res.status(503).json({ ok: false, error: "database unavailable" });
    }
});

app.get("/api/devotionals", requireAuth, async (req, res) => {
    const result = await pool.query("SELECT * FROM devotionals");
    res.json(result.rows);
});

app.post('/api/entry', requireAuth, async (req, res) => {
    try {
        const {
            date,
            scripture,
            prayRead,
            prrCheckboxes,
            reflectionTypes,
            godAboutHimself,
            godAboutUs,
            godToldMePersonally,
            myResponse,
            takeaway,
        } = req.body;

        const missingFields = [];

        if (!isNonEmptyString(scripture)) missingFields.push("scripture");
        if (!isNonEmptyString(prayRead)) missingFields.push("prayRead");
        if (!isNonEmptyString(godAboutHimself)) missingFields.push("godAboutHimself");
        if (!isNonEmptyString(godAboutUs)) missingFields.push("godAboutUs");
        if (!isNonEmptyString(godToldMePersonally)) missingFields.push("godToldMePersonally");
        if (!isNonEmptyString(myResponse)) missingFields.push("myResponse");
        if (!isNonEmptyString(takeaway)) missingFields.push("takeaway");
        if (!hasAllSelectedOptions(prrCheckboxes)) missingFields.push("prrCheckboxes");
        if (!hasSelectedOption(reflectionTypes)) missingFields.push("reflectionTypes");

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: "Please fill in all required fields.",
                missingFields,
            });
        }

        const result = await pool.query(
            `INSERT INTO entries (
                user_id,
                date,
                scripture,
                scripture_text,
                pray_read,
                prr_checkboxes,
                reflection_types,
                god_about_himself,
                god_about_us,
                god_told_me_personally,
                my_response,
                takeaway
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                req.session.userId,
                date,
                scripture,
                null,
                prayRead,
                JSON.stringify(prrCheckboxes),
                JSON.stringify(reflectionTypes),
                godAboutHimself,
                godAboutUs,
                godToldMePersonally,
                myResponse,
                takeaway,
            ]
        );

        res.json({ success: true, entry: result.rows[0] });
    } catch (error) {
        console.error('Error saving entry:', error);
        res.status(500).json({ error: 'Failed to save entry' });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user.id;

    res.json({ success: true, seenHowTo: Boolean(user.seen_how_to) });
});

app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        "INSERT INTO users (email, password_hash, seen_how_to) VALUES ($1, $2, $3) RETURNING *",
        [email, hashedPassword, false]
    );

    const newUser = result.rows[0];
    req.session.userId = newUser.id;

    res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
        return res.json({ user: null });
    }

    const result = await pool.query(
        "SELECT id, email, seen_how_to FROM users WHERE id = $1",
        [req.session.userId]
    );

    res.json({ user: result.rows[0] });
});

app.post("/api/me/seen-how-to", requireAuth, async (req, res) => {
    try {
        await pool.query(
            "UPDATE users SET seen_how_to = TRUE WHERE id = $1",
            [req.session.userId]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error("Error updating seen_how_to flag:", error);
        return res.status(500).json({ error: "Failed to update user flag." });
    }
});

app.post("/api/me/change-password", requireAuth, async (req, res) => {
    try {
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required." });
        }

        const result = await pool.query(
            "SELECT id, password_hash FROM users WHERE id = $1",
            [req.session.userId]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!validCurrentPassword) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [newHash, req.session.userId]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ error: "Failed to change password." });
    }
});

app.get("/api/entries", requireAuth, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 25;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM entries WHERE user_id = $1",
            [req.session.userId]
        );
        const totalCount = parseInt(countResult.rows[0].count);

        // Get paginated entries
        const entriesResult = await pool.query(
            `SELECT id, date, scripture, takeaway FROM entries 
             WHERE user_id = $1 
             ORDER BY date DESC, created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.session.userId, limit, offset]
        );

        res.json({
            entries: entriesResult.rows,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        });
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

app.get("/api/entries/previous", requireAuth, async (req, res) => {
    try {
        const requestedDate = String(req.query.date || "").trim();

        if (!requestedDate) {
            return res.status(400).json({ error: "Missing date query parameter." });
        }

        const result = await pool.query(
            `SELECT id, date, scripture
             FROM entries
             WHERE user_id = $1
                             AND date::date < $2::date
                         ORDER BY date::date DESC, created_at DESC
             LIMIT 1`,
            [req.session.userId, requestedDate]
        );

        if (result.rows.length === 0) {
            return res.json({ scripture: null });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching previous entry:", error);
        return res.status(500).json({ error: "Failed to fetch previous entry." });
    }
});

app.get("/api/entries/:id", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM entries WHERE id = $1 AND user_id = $2",
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching entry:', error);
        res.status(500).json({ error: 'Failed to fetch entry' });
    }
});

app.delete("/api/entries/:id", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM entries WHERE id = $1 AND user_id = $2 RETURNING id",
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error("Error deleting entry:", error);
        return res.status(500).json({ error: "Failed to delete entry" });
    }
});

app.get("/api/journal-entries", requireAuth, async (req, res) => {
    try {
        const week = String(req.query.week || "").trim();

        if (!week) {
            return res.status(400).json({ error: "Missing week query parameter." });
        }

        const result = await pool.query(
            `SELECT id, week, entry, entry_type, position
             FROM journal_entries
             WHERE user_id = $1 AND week = $2
             ORDER BY position ASC, id ASC`,
            [req.session.userId, week]
        );

        return res.json({ entries: result.rows });
    } catch (error) {
        console.error("Error fetching journal entries:", error);
        return res.status(500).json({ error: "Failed to fetch journal entries." });
    }
});

app.post("/api/journal-entries", requireAuth, async (req, res) => {
    try {
        const week = String(req.body.week || "").trim();
        const entry = String(req.body.entry || "").trim();
        const entryType = String(req.body.entryType || "").trim().toLowerCase();

        if (!week || !entry || !isValidJournalType(entryType)) {
            return res.status(400).json({ error: "Invalid request body." });
        }

        const maxPositionResult = await pool.query(
            `SELECT COALESCE(MAX(position), -1) AS max_position
             FROM journal_entries
             WHERE user_id = $1 AND week = $2 AND entry_type = $3`,
            [req.session.userId, week, entryType]
        );

        const nextPosition = Number(maxPositionResult.rows[0].max_position) + 1;

        const insertResult = await pool.query(
            `INSERT INTO journal_entries (user_id, week, entry, entry_type, position)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, week, entry, entry_type, position`,
            [req.session.userId, week, entry, entryType, nextPosition]
        );

        return res.status(201).json({ entry: insertResult.rows[0] });
    } catch (error) {
        console.error("Error creating journal entry:", error);
        return res.status(500).json({ error: "Failed to create journal entry." });
    }
});

app.delete("/api/journal-entries/:id", requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const entryResult = await client.query(
            `SELECT id, week, entry_type
             FROM journal_entries
             WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.session.userId]
        );

        if (entryResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Journal entry not found." });
        }

        const { week, entry_type: entryType } = entryResult.rows[0];

        await client.query(
            "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2",
            [req.params.id, req.session.userId]
        );

        await client.query(
            `WITH ordered AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC, id ASC) - 1 AS new_position
                FROM journal_entries
                WHERE user_id = $1 AND week = $2 AND entry_type = $3
             )
             UPDATE journal_entries j
             SET position = ordered.new_position,
                 updated_at = NOW()
             FROM ordered
             WHERE j.id = ordered.id`,
            [req.session.userId, week, entryType]
        );

        await client.query("COMMIT");
        return res.json({ success: true });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error deleting journal entry:", error);
        return res.status(500).json({ error: "Failed to delete journal entry." });
    } finally {
        client.release();
    }
});

app.put("/api/journal-entries/reorder", requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        const week = String(req.body.week || "").trim();
        const entries = Array.isArray(req.body.entries) ? req.body.entries : [];

        if (!week) {
            return res.status(400).json({ error: "Missing week value." });
        }

        if (entries.length === 0) {
            return res.json({ success: true });
        }

        const ids = [];

        for (const item of entries) {
            if (
                !item ||
                typeof item.id !== "number" ||
                !isValidJournalType(String(item.entryType || "").trim().toLowerCase()) ||
                typeof item.position !== "number"
            ) {
                return res.status(400).json({ error: "Invalid reorder payload." });
            }
            ids.push(item.id);
        }

        await client.query("BEGIN");

        const ownershipResult = await client.query(
            `SELECT id
             FROM journal_entries
             WHERE user_id = $1 AND week = $2 AND id = ANY($3::int[])`,
            [req.session.userId, week, ids]
        );

        if (ownershipResult.rows.length !== ids.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "One or more entries are invalid." });
        }

        for (const item of entries) {
            await client.query(
                `UPDATE journal_entries
                 SET entry_type = $1,
                     position = $2,
                     updated_at = NOW()
                 WHERE id = $3 AND user_id = $4 AND week = $5`,
                [String(item.entryType).trim().toLowerCase(), item.position, item.id, req.session.userId, week]
            );
        }

        await client.query("COMMIT");
        return res.json({ success: true });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error reordering journal entries:", error);
        return res.status(500).json({ error: "Failed to reorder journal entries." });
    } finally {
        client.release();
    }
});

app.post("/api/journal-entries/copy-previous-week", requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        const week = String(req.body.week || "").trim();
        const previousWeek = String(req.body.previousWeek || "").trim();

        if (!week || !previousWeek) {
            return res.status(400).json({ error: "Missing week or previousWeek." });
        }

        await client.query("BEGIN");

        const existingResult = await client.query(
            `SELECT COUNT(*)::int AS count
             FROM journal_entries
             WHERE user_id = $1 AND week = $2`,
            [req.session.userId, week]
        );

        if (existingResult.rows[0].count > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Current week already has entries." });
        }

        const previousEntriesResult = await client.query(
            `SELECT entry, entry_type, position
             FROM journal_entries
             WHERE user_id = $1 AND week = $2
             ORDER BY entry_type ASC, position ASC, id ASC`,
            [req.session.userId, previousWeek]
        );

        if (previousEntriesResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "No entries found for previous week." });
        }

        for (const item of previousEntriesResult.rows) {
            await client.query(
                `INSERT INTO journal_entries (user_id, week, entry, entry_type, position)
                 VALUES ($1, $2, $3, $4, $5)`,
                [req.session.userId, week, item.entry, item.entry_type, item.position]
            );
        }

        await client.query("COMMIT");
        return res.json({ success: true, copied: previousEntriesResult.rows.length });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error copying previous week entries:", error);
        return res.status(500).json({ error: "Failed to copy previous week entries." });
    } finally {
        client.release();
    }
});

app.post("/api/test/email/first-user", async (req, res) => {
    const transporter = getTransporter();

    if (!transporter) {
        return res.status(500).json({
            error: "SMTP is not configured. Set SMTP_HOST (and optional auth vars).",
        });
    }

    try {
        const userResult = await pool.query(
            "SELECT id, email FROM users ORDER BY id ASC LIMIT 1"
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "No users found in database." });
        }

        const firstUser = userResult.rows[0];
        const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@devotional.local";

        await transporter.sendMail({
            from: smtpFrom,
            to: firstUser.email,
            subject: "Devotional Test Email",
            text: "This is a test email from the Devotional API.",
        });

        res.json({ success: true, to: firstUser.email, userId: firstUser.id });
    } catch (error) {
        console.error("Failed to send test email:", error);
        res.status(500).json({
            error: "Failed to send test email.",
            code: error.code || null,
            responseCode: error.responseCode || null,
            response: error.response || null,
            command: error.command || null,
        });
    }
});

app.get("/api/test/email/verify-smtp", async (req, res) => {
    const transporter = getTransporter();

    if (!transporter) {
        return res.status(500).json({
            ok: false,
            error: "SMTP is not configured. Set SMTP_HOST (and optional auth vars).",
        });
    }

    try {
        await transporter.verify();
        res.json({ ok: true });
    } catch (error) {
        console.error("SMTP verify failed:", error);
        res.status(500).json({
            ok: false,
            code: error.code || null,
            responseCode: error.responseCode || null,
            response: error.response || null,
            command: error.command || null,
        });
    }
});

app.get("/api/test/email/config", async (req, res) => {
    const smtpHost = process.env.SMTP_HOST || "";
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const smtpFrom = process.env.SMTP_FROM || "";
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    res.json({
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpFrom,
        smtpUserMasked: smtpUser ? `${smtpUser.slice(0, 2)}***${smtpUser.slice(-2)}` : "",
        smtpPassLength: smtpPass.length,
    });
});

app.use((err, req, res, next) => {
    logError("unhandled_error", {
        path: req.originalUrl,
        method: req.method,
        message: err?.message || "Unknown error",
    });

    if (res.headersSent) {
        return next(err);
    }

    return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
    logInfo("server_start", { port: PORT, env: NODE_ENV });
    startEmailScheduler();
});
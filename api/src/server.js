// src/server.js
require("dotenv").config();

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const express = require('express');
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require('./db');
const requireAuth = require("./middleware/auth");

const REFLECTION_TYPES = [
    "Principle to live by",
    "Sin to forsake",
    "Hope to celebrate",
    "Example to follow",
    "Insight about the church to apply",
    "Command to obey",
    "Error to avoid",
    "Promise to claim",
    "Perspective to adopt",
];

const PRR_LABELS = ["Pray", "Read", "Respond"];
const EMAIL_DELAY_HOURS = 4;
const EMAIL_CHECK_INTERVAL_MS = Number(process.env.EMAIL_CHECK_INTERVAL_MS || 60000);

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
    const prrValues = normalizeBooleanArray(entry.prr_checkboxes);
    const reflectionValues = normalizeBooleanArray(entry.reflection_types);

    const selectedPrr = PRR_LABELS.filter((_, idx) => prrValues[idx]).join(", ") || "None";
    const selectedReflections = REFLECTION_TYPES.filter((_, idx) => reflectionValues[idx]).join("\n- ") || "None";

    return [
        `Devotional Entry - ${entry.date}`,
        "",
        `Scripture: ${entry.scripture || "N/A"}`,
        `Scripture Text: ${entry.scripture_text || "N/A"}`,
        "",
        `PRR Checked: ${selectedPrr}`,
        "",
        "Pray & Read",
        entry.pray_read || "N/A",
        "",
        "Reflection Types",
        selectedReflections === "None" ? "None" : `- ${selectedReflections}`,
        "",
        "What God Shows Us About Himself",
        entry.god_about_himself || "N/A",
        "",
        "What God Shows Us About Us",
        entry.god_about_us || "N/A",
        "",
        "What God Told Me Personally",
        entry.god_told_me_personally || "N/A",
        "",
        "My Response",
        entry.my_response || "N/A",
        "",
        "Takeaway",
        entry.takeaway || "N/A",
    ].join("\n");
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
                    subject: `Devotional Entry - ${entry.date}`,
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
app.use(express.json());
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: "session"
    }),
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.get("/api/devotionals", requireAuth, async (req, res) => {
    const result = await pool.query("SELECT * FROM devotionals");
    res.json(result.rows);
});

app.post('/api/entry', requireAuth, async (req, res) => {
    try {
        const {
            date,
            scripture,
            scriptureText,
            prayRead,
            prrCheckboxes,
            reflectionTypes,
            godAboutHimself,
            godAboutUs,
            godToldMePersonally,
            myResponse,
            takeaway,
        } = req.body;

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
                scriptureText || null,
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

    res.json({ success: true });
});

app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
        [email, hashedPassword]
    );

    res.json(result.rows[0]);
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
        "SELECT id, email FROM users WHERE id = $1",
        [req.session.userId]
    );

    res.json({ user: result.rows[0] });
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

app.listen(3001, () => {
    console.log('API running on 3001');
    startEmailScheduler();
});
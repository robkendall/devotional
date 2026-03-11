// src/server.js
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// create table if needed
pool.query(`
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);

app.post('/api/entry', async (req, res) => {
  const { content } = req.body;
  const result = await pool.query(
    'INSERT INTO entries (content, created_at) VALUES ($1, NOW()) RETURNING *',
    [content]
  );
  res.json(result.rows[0]);
});

app.get('/api/entry/latest', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM entries ORDER BY created_at DESC LIMIT 1'
  );
  res.json(result.rows[0]);
});

app.listen(3001, () => console.log('API running on 3001'));
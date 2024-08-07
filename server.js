const port = process.env.PORT || 3001;
const express = require("express");
const app = express();
app.use(express.json());

const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "long",
  host: "dpg-cqot672j1k6c73d89ml0-a.singapore-postgres.render.com",
  database: "microservices_demo_vnn9",
  password: "E3dO6I2cov4lbpZ16ahBTcSeF7yGhY2s",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

app.get('/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expense');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM expense WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Expense not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/expenses', async (req, res) => {
  try {
    const { userSpend, total, name, date } = req.body;
    const result = await pool.query(
      'INSERT INTO expense (userSpend, total, name, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [userSpend, total, name, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userSpend, total, name, date } = req.body;
    const result = await pool.query(
      'UPDATE expense SET userSpend = $1, total = $2, name = $3, date = $4 WHERE id = $5 RETURNING *',
      [userSpend, total, name, date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Expense not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM expense WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Expense not found');
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

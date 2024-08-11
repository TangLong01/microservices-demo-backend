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
  user: "avnadmin",
  host: "pg-325c37cd-hlongoo450-c3a3.g.aivencloud.com",
  database: "defaultdb",
  password: "AVNS_x294kvz-82wYPl2GxpB",
  port: 16556,
  ssl: { rejectUnauthorized: false },
});

app.get("/expenses", async (req, res) => {
  try {
    const { _start, _end } = req.query;
    const start = parseInt(_start, 10) || 0;
    const end = parseInt(_end, 10) || 10;
    const limit = end - start;

    const totalResult = await pool.query("SELECT COUNT(*) FROM expense");
    const total = parseInt(totalResult.rows[0].count, 10);

    const result = await pool.query(
      "SELECT * FROM expense ORDER BY id LIMIT $1 OFFSET $2",
      [limit, start]
    );

    res.set("Content-Range", `expenses ${start}-${end}/${total}`);
    res.set("Access-Control-Expose-Headers", "Content-Range");

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM expense WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Expense not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/expenses", async (req, res) => {
  try {
    const { userSpend, total, description, date } = req.body;
    const result = await pool.query(
      "INSERT INTO expense (userSpend, total, description, date) VALUES ($1, $2, $3, $4) RETURNING *",
      [userSpend, total, description, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.put("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userSpend, total, description, date } = req.body;
    const result = await pool.query(
      "UPDATE expense SET userSpend = $1, total = $2, description = $3, date = $4 WHERE id = $5 RETURNING *",
      [userSpend, total, description, date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Expense not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.delete("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM expense WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Expense not found");
    }
    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

const port = process.env.PORT || 3001;
const express = require("express");
const app = express();
app.use(express.json());

const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
app.use(cors({
  exposedHeaders: ['X-Total-Count']
}));
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
    const { description, startDate, endDate, _sort, _order, _start, _end } = req.query;

    let query = "SELECT * FROM expense";
    const queryParams = [];
    
    let conditions = [];
    if (description) {
      conditions.push("description ILIKE $" + (conditions.length + 1));
      queryParams.push(`%${description}%`);
    }

    if (startDate && endDate) {
      conditions.push("date BETWEEN $" + (conditions.length + 1) + " AND $" + (conditions.length + 2));
      queryParams.push(startDate);
      queryParams.push(endDate);
    } else if (startDate) {
      conditions.push("date >= $" + (conditions.length + 1));
      queryParams.push(startDate);
    } else if (endDate) {
      conditions.push("date <= $" + (conditions.length + 1));
      queryParams.push(endDate);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const defaultSortField = "date";
    const defaultSortOrder = "DESC";

    const sortField = _sort || defaultSortField;
    const sortOrder = _order || defaultSortOrder;
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const startIndex = parseInt(_start, 10) || 0;
    const endIndex = parseInt(_end, 10) || 10;

    const limit = endIndex - startIndex;
    const offset = startIndex;

    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    const countQuery = "SELECT COUNT(*) FROM expense";
    const countResult = await pool.query(countQuery);
    const totalRecords = countResult.rows[0].count;

    res.set("X-Total-Count", totalRecords.toString());
    res.set("Access-Control-Expose-Headers", "X-Total-Count");

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
    const { total, description, date } = req.body;
    const result = await pool.query(
      "INSERT INTO expense (total, description, date) VALUES ($1, $2, $3) RETURNING *",
      [total, description, date]
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
    const { total, description, date } = req.body;
    const result = await pool.query(
      "UPDATE expense SET total = $1, description = $2, date = $3 WHERE id = $4 RETURNING *",
      [total, description, date, id]
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

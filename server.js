const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = process.env.PORT || 3001;
const cors = require("cors");
const bodyParser = require("body-parser");

const pool = new Pool({
  user: "long",
  host: "localhost",
  database: "microservices_demo",
  password: "long200801",
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    const data = result.rows;
    res.json(data);
  } catch (error) {
    console.error("Lỗi truy vấn cơ sở dữ liệu:", error);
  }
});

app.post("/products", async (req, res) => {
  const { name, price } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *",
      [name, price]
    );

    const newProduct = result.rows[0];
    res.json({ message: "Tạo mới sản phẩm thành công", product: newProduct });
  } catch (error) {
    console.error("Lỗi tạo mới sản phẩm:", error);
  }
});

app.delete("/products/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [
      productId,
    ]);
    res.json({ message: "Xoá sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi xoá sản phẩm từ cơ sở dữ liệu:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/products/:id", async (req, res) => {
  const productId = req.params.id;
  const { price } = req.body;

  try {
    const result = await pool.query(
      "UPDATE products SET price = $1 WHERE id = $2",
      [price, productId]
    );
    res.json({ message: "Cập nhật thông tin sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin sản phẩm:", error);
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

import express from "express";
import { pool } from "./db";

const app = express();
app.use(express.json());

app.get("/api/todos", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM todos ORDER BY created_at DESC");
  res.json(rows);
});

pool
  .query("SELECT NOW()")
  .then((r) => console.log(" Подключение ок:", r.rows[0]))
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Ошибка:", message);
  });

app.listen(3000, () => console.log("Server on http://localhost:3000"));
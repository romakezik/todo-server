import express from "express";
import { pool } from "./db";
import type { Todo } from "./types";

const app = express();
app.use(express.json());

app.get("/api/todos", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM todos ORDER BY created_at DESC"
  );
  res.json(rows);
});

app.get("/api/todos/:id", async (req, res) => {
  try {
    const { rows } = await pool.query<Todo>(
      "SELECT * FROM todos WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.listen(3000, () => console.log("Server on http://localhost:3000"));
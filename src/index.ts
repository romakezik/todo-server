import express from "express";
import { pool } from "./db";
import type { Todo } from "./types";
import { asyncHandler } from "./asyncHandler";
import type { Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());

app.get(
  "/api/todos",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM todos ORDER BY created_at DESC"
    );
    res.json(rows);
  })
);

app.get(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<Todo>(
      "SELECT * FROM todos WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }
    res.json(rows[0]);
  })
);

app.post(
  "/api/todos",
  asyncHandler(async (req, res) => {
    const { text, user_id } = req.body;

    if (!text || !user_id || typeof text !== "string") {
      res.status(400).json({ message: "text и user_id обязательны" });
      return;
    }

    const { rows } = await pool.query<Todo>(
      "INSERT INTO todos (id, text, completed, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [crypto.randomUUID(), text.trim(), false, user_id]
    );
    res.status(201).json(rows[0]);
  })
);

app.patch(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({ message: "text обязателен" });
      return;
    }

    const { rows } = await pool.query<Todo>(
      "UPDATE todos SET text = $1 WHERE id = $2 RETURNING *",
      [text.trim(), req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    res.json(rows[0]);
  })
);

app.delete(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<Todo>(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    res.status(204).end();
  })
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Ошибка сервера" });
});

app.listen(3000, () => console.log("Server on http://localhost:3000"));
import express from "express";
import { pool } from "./db";
import type { Todo } from "./types";
import { asyncHandler } from "./asyncHandler";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth } from "./authMiddleware";

const app = express();
app.use(express.json());

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !password || !name || password.length < 8) {
      res.status(400).json({
        message: "почта, имя, пароль обязательны. Пароль минимум 8 символов",
      });
      return;
    }

    const existing = await pool.query(
      "SELECT id FROM server_users WHERE email = $1",
      [email],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ message: "Почта уже зарегистрирована" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO server_users (id, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, email, name",
      [crypto.randomUUID(), email, password_hash, name],
    );

    res.status(201).json(rows[0]);
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email и password обязательны" });
      return;
    }

    const { rows } = await pool.query(
      "SELECT * FROM server_users WHERE email = $1",
      [email],
    );
    if (rows.length === 0) {
      res.status(401).json({ message: "Неверный email или пароль" });
      return;
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      res.status(401).json({ message: "Неверный email или пароль" });
      return;
    }

    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({
      user: { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      token,
    });
  }),
);

app.use("/api/todos", auth);

app.get(
  "/api/todos",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<Todo>(
      "SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
      [req.userId],
    );
    res.json(rows);
  }),
);

app.get(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<Todo>(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId],
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    res.json(rows[0]);
  }),
);

app.post(
  "/api/todos",
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({ message: "text обязателен" });
      return;
    }

    const { rows } = await pool.query<Todo>(
      "INSERT INTO todos (id, text, completed, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [crypto.randomUUID(), text.trim(), false, req.userId],
    );

    res.status(201).json(rows[0]);
  }),
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
      "UPDATE todos SET text = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [text.trim(), req.params.id, req.userId],
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    res.json(rows[0]);
  }),
);

app.delete(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<Todo>(
      "DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.userId],
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    res.status(204).end();
  }),
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Ошибка сервера" });
});

app.listen(3000, () => console.log("Server on http://localhost:3000"));

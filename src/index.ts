import express from "express";
import { asyncHandler } from "./asyncHandler";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { auth } from "./authMiddleware";
import cors from "cors";
import { createToken } from "./lib/jwt";
import { prisma } from "./prisma";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

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

    const existing = await prisma.server_users.findUnique({
      where: { email },
    });

    if (existing) {
      res.status(409).json({ message: "Почта уже зарегистрирована" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.server_users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        password_hash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = createToken(user.id);

    res.status(201).json({ user, token });
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

    const user = await prisma.server_users.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(401).json({ message: "Неверный email или пароль" });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ message: "Неверный email или пароль" });
      return;
    }

    const token = createToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  }),
);

app.use("/api/todos", auth);

app.get(
  "/api/auth/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await prisma.server_users.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    if (!user) {
      res.status(401).json({ message: "Пользователь не найден" });
      return;
    }
    res.json(user);
  }),
);

app.get(
  "/api/todos",
  asyncHandler(async (req, res) => {
    const todos = await prisma.todos.findMany({
      where: { user_id: req.userId! },
      orderBy: { created_at: "desc" },
    });
    res.json(todos);
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

    const todo = await prisma.todos.create({
      data: {
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false,
        user_id: req.userId!,
      },
    });

    res.status(201).json(todo);
  }),
);

app.patch(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const { text, completed } = req.body;

    if (text !== undefined) {
      if (typeof text !== "string" || !text.trim()) {
        res.status(400).json({ message: "text не может быть пустым" });
        return;
      }
      const result = await prisma.todos.updateMany({
        where: { id: req.params.id, user_id: req.userId! },
        data: { text: text.trim() },
      });
      if (result.count === 0) {
        res.status(404).json({ message: "Задача не найдена" });
        return;
      }
      const updated = await prisma.todos.findUnique({
        where: { id: req.params.id },
      });
      res.json(updated);
      return;
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        res.status(400).json({ message: "completed должен быть boolean" });
        return;
      }
      const result = await prisma.todos.updateMany({
        where: { id: req.params.id, user_id: req.userId! },
        data: { completed },
      });
      if (result.count === 0) {
        res.status(404).json({ message: "Задача не найдена" });
        return;
      }
      const updated = await prisma.todos.findUnique({
        where: { id: req.params.id },
      });
      res.json(updated);
      return;
    }

    res.status(400).json({ message: "нечего обновлять" });
  }),
);

app.delete(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    const result = await prisma.todos.deleteMany({
      where: {
        id: req.params.id,
        user_id: req.userId!,
      },
    });

    if (result.count === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    res.status(204).end();
  }),
);

app.delete(
  "/api/auth/me",
  auth,
  asyncHandler(async (req, res) => {
    await prisma.server_users.delete({
      where: { id: req.userId! },
    });
    res.status(204).end();
  }),
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Ошибка сервера" });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

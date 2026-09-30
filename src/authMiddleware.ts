import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = (payload as { id: string }).id;
    next();
  } catch {
    res.status(401).json({ message: "Невалидный токен" });
  }
}

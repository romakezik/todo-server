export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

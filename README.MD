# todo-server

REST API для [react-todo](https://romakezik-todo.netlify.app).
Node.js + Express 5 + TypeScript · PostgreSQL · JWT + bcrypt · AI-прокси

## Стек
Node.js + Express 5 + TypeScript · PostgreSQL · JWT + bcrypt

## API

POST    /api/auth/register    регистрация, bcrypt, токен
POST    /api/auth/login       вход, токен
GET     /api/auth/me          текущий юзер
DELETE  /api/auth/me          удаление аккаунта с данными
GET/POST  /api/todos          список / создание
PATCH/DELETE  /api/todos/:id  изменение / удаление
POST    /api/ai/chat          AI-ассистент, rate limit 20/мин
GET     /api/health           health-check

`/api/todos` и `/api/ai/chat` требуют `Authorization: Bearer <token>`.

## AI

Модель получает задачи юзера в system-промпте и возвращает ответ с тегами:

  <add_todo>текст</add_todo>          — добавить задачу
  <complete_todo>точный текст</complete_todo> — отметить
  <delete_todo>точный текст</delete_todo>     — удалить (с подтверждением на клиенте)

Сервер парсит теги в `actions`, клиент исполняет через todos-эндпоинты.
Провайдер задаётся через env, по умолчанию — бесплатный OpenAI-совместимый эндпоинт.

## Запуск

npm install
# .env: DATABASE_URL, JWT_SECRET
#       AI_BASE_URL, AI_MODEL (опционально)
npm run dev
# todo-server

REST API для [react-todo](https://romakezik-todo.netlify.app) —
фуллстек: переход от supabase бэкэнда к собственному.

## Стек
Node.js + Express 5 + TypeScript · PostgreSQL · JWT + bcrypt

## API

POST  /api/auth/register  регистрация, bcrypt, токен 
POST  /api/auth/login  вход, токен 
GET  /api/auth/me  текущий юзер 
DELETE  /api/auth/me  удаление аккаунта с данными 
GET/POST  /api/todos  список / создание 
PATCH/DELETE  /api/todos/:id  изменение / удаление 
GET  /api/health  health-check 

/api/todos требуют Authorization: Bearer <token>.

## Запуск
npm install  # .env: DATABASE_URL, JWT_SECRET
npm run dev
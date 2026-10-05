# Task Manager API — Week 3 (Deploy-Ready)

Node.js + Express REST API with SQLite persistence, JWT authentication, and
protected routes. Configured to run locally **and** deploy live on a cloud
platform (Render, Railway, etc.) without changes.

## Features
- **Express backend**: `src/app.js`, `src/server.js`
- **Database integration**: SQLite via Node built-in `node:sqlite` (Node 22.13+, no compiling needed) (`src/db.js`),
  `users` and `tasks` tables, foreign key + CHECK constraint
- **REST CRUD**: `/api/tasks` — POST, GET (list/single), PUT, DELETE
- **Authentication**: register/login, bcrypt-hashed passwords, JWT (1h expiry)
- **Protected routes**: `authenticate` middleware guards `/api/tasks/*` and `/api/auth/me`
- **Authorization**: users only see/modify their own tasks
- **Health check**: `GET /health` (used by hosting platforms to verify the app is alive)
- **Tests**: 13 automated tests — `npm test`

## Run locally
```bash
npm install
cp .env.example .env     # set a strong JWT_SECRET
npm start                # http://localhost:3000
npm test
```

## Deploy live (Render — free, no credit card)
1. Push this project to a GitHub repository (include everything except
   `node_modules`, `.env` and `*.db` — already excluded via `.gitignore`).
2. Go to Render, click **New → Blueprint**, and point it at your repo.
   Render will read `render.yaml` and auto-configure the service
   (build command, start command, health check, and a generated `JWT_SECRET`).
3. Alternatively, **New → Web Service** manually:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
   - Environment variables: `JWT_SECRET` (any long random string),
     `JWT_EXPIRES_IN=1h`
4. Deploy. Render assigns a public URL like `https://task-manager-api.onrender.com`.
5. Open that URL — the frontend in `public/index.html` is served automatically,
   and all `/api/...` routes work the same as local.

The app is already deploy-safe:
- Binds to `0.0.0.0` and reads `PORT` from the environment (required by every
  cloud host).
- `DB_FILE` is configurable via env var, so the SQLite file can be pointed at
  a persistent disk if you add one.
- CORS is enabled, so the API can also be called from a separately hosted
  frontend if needed.
- `Procfile` is included for Heroku-style platforms as a fallback.

## API
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | – | `{name,email,password}` → user + token |
| POST | /api/auth/login | – | `{email,password}` → user + token |
| GET | /api/auth/me | Bearer | current user |
| POST | /api/tasks | Bearer | create `{title, description?, status?}` |
| GET | /api/tasks[?status=done] | Bearer | list own tasks |
| GET | /api/tasks/:id | Bearer | get one |
| PUT | /api/tasks/:id | Bearer | update |
| DELETE | /api/tasks/:id | Bearer | delete (204) |
| GET | /health | – | health check for hosting platform |

Status values: `todo`, `in_progress`, `done`.

## Evidence
- `EVIDENCE.txt` — live curl output (401 without token, 200 with token, full CRUD, DB check)
- `TEST_RESULTS.txt` — automated test results (13/13 passing)

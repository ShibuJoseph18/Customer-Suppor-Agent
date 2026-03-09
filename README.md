# Customer Support Agent

Koa + TypeScript API with SQLite and Drizzle ORM.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
cp .env.example .env
# Edit .env if needed (PORT, DATABASE_URL)
```

## Database

Initialize the database (creates DB file, tables, and seed data):

```bash
npm run db:init
```

This will:

1. Create the database directory from `DATABASE_URL` if it doesn’t exist
2. Push the schema (create/update tables)
3. Run the seed script (adds dummy data; skips tables that already have data)

Other DB commands:
| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run db:push`    | Sync schema to DB (create/update tables) |
| `npm run db:seed`    | Run seed only (skips existing data)     |
| `npm run db:generate`| Generate migrations from schema         |
| `npm run db:migrate` | Run migrations                          |
| `npm run db:studio`  | Open Drizzle Studio                     |

Seed users all use password: **`SeedPass123!`**. After `db:init` or `db:seed`, the script prints email/password pairs for login.

## Run

```bash
npm run dev
```

Server runs at `http://localhost:3000` (or the `PORT` in `.env`).

## Environment

| Variable       | Description              | Default           |
|----------------|--------------------------|-------------------|
| `PORT`         | Server port              | `3000`            |
| `DATABASE_URL` | SQLite DB path           | `./data/sqlite.db`|

## Project structure

```
src/
  app.ts           # Koa app and routes
  server.ts        # Server entry
  config/          # Config (port, DB URL)
  db/              # Drizzle schema and client
  scripts/         # init-db, seed
drizzle/           # Generated migrations
```

## API

- **GET /health** — Health check; returns `{ "status": "ok" }`.

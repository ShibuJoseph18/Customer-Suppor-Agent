#!/usr/bin/env node
/**
 * Initialize database: ensure directory exists, push schema (create/update tables), then seed.
 * Skips creation if DB and tables exist; seed script skips inserts if data already present.
 */
import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runSeed } from "./seed-data.js";
// import { runSeed } from "./seed.js";


const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const dbUrl = process.env.DATABASE_URL ?? "./data/sqlite.db";
const dbPath =
  dbUrl.startsWith("/") || dbUrl.match(/^[A-Za-z]:/)
    ? dbUrl
    : resolve(process.cwd(), dbUrl);

if (!dbUrl.startsWith(":memory:")) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log("[db:init] Created directory:", dir);
  } else {
    console.log("[db:init] Database directory exists:", dir);
  }
}

console.log("[db:init] Pushing schema (create/update tables)...");
execSync("npx drizzle-kit push", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: dbPath },
});

console.log("[db:init] Running seed...");
await runSeed();

console.log("[db:init] Done.");

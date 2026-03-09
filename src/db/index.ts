import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { config } from "../config/config.js";
import * as schema from "./schema.js";

const dbPath =
  config.database.url.startsWith("/") || config.database.url.match(/^[A-Za-z]:/)
    ? config.database.url
    : resolve(process.cwd(), config.database.url);

if (!config.database.url.startsWith(":memory:")) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export * from "./schema.js";

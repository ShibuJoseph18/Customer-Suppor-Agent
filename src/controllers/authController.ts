import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Context } from "koa";
import { and, eq } from "drizzle-orm";
import { db, users, credentials } from "../db/index.js";
import { config } from "../config/config.js";
import { slugify } from "../lib/slug.js";
import type { RegisterSchema } from "../routes/auth.js";

function signToken(input: { id: string; email: string; role: string }) {
  return jwt.sign(
    { email: input.email, role: input.role },
    config.auth.jwtSecret,
    {
      subject: input.id,
      issuer: config.auth.jwtIssuer,
      expiresIn: "7d",
    }
  );
}

// ── POST /auth/register ───────────────────────────────────────────────────────
export async function register(ctx: Context) {
  // Body already validated & coerced by Zod middleware
  const { email, password, name, role} = (ctx.request as any).body as RegisterSchema;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    ctx.status = 409;
    ctx.body = { error: "email_already_registered" };
    return;
  }

  const id = randomUUID();
  const now = new Date();
  const baseSlug = slugify(name) || "user";
  const slug = `${baseSlug}-${id.slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    id,
    slug,
    email,
    phone: null,
    role: role || "customer",
    name,
    avatar: null,
    locale: "en",
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    emailValidated: null,
    phoneValidated: null,
    bio: null,
    company: null,
  });

  await db.insert(credentials).values({
    providerId: "email_password",
    providerKey: email,
    userId: id,
    hasher: "bcrypt",
    passwordHash,
    passwordSalt: "",
  });
  
  ctx.status = 201;
  ctx.body = { user: { id, email, role: "customer", name, slug } };
}

// ── POST /auth/login ──────────────────────────────────────────────────────────
export async function login(ctx: Context) {
  const { email, password } = (ctx.request as any).body as {
    email: string;
    password: string;
  };

  const row = await db
    .select({
      userId: credentials.userId,
      passwordHash: credentials.passwordHash,
      email: users.email,
      role: users.role,
      name: users.name,
      slug: users.slug,
    })
    .from(credentials)
    .innerJoin(users, eq(credentials.userId, users.id))
    .where(
      and(
        eq(credentials.providerId, "email_password"),
        eq(credentials.providerKey, email)
      )
    )
    .limit(1);

  if (row.length === 0) {
    ctx.status = 401;
    ctx.body = { error: "invalid_credentials" };
    return;
  }

  const ok = await bcrypt.compare(password, row[0]!.passwordHash);
  if (!ok) {
    ctx.status = 401;
    ctx.body = { error: "invalid_credentials" };
    return;
  }

  const token = signToken({
    id: row[0]!.userId,
    email: row[0]!.email,
    role: row[0]!.role,
  });

  ctx.body = {
    token,
    user: {
      id: row[0]!.userId,
      email: row[0]!.email,
      role: row[0]!.role,
      name: row[0]!.name,
      slug: row[0]!.slug,
    },
  };
}

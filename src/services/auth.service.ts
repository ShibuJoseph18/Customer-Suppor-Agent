import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { db, users, credentials } from "../db/index.js";
import { slugify } from "../lib/slug.js";
import type { RegisterSchema, LoginSchema } from "../routes/auth.js";
import { signToken } from "../helpers/auth.helper.js";

export async function registerService(user: RegisterSchema) {
  const { email, password, name, role } = user;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("email_already_registered");
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

  return { user: { id, email, role: "customer", name, slug } };
}

export async function loginService(user: LoginSchema) {
  const { email, password } = user;
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
        eq(credentials.providerKey, email),
      ),
    )
    .limit(1);

  if (row.length === 0) {
    throw new Error("invalid_credentials");
  }

  const ok = await bcrypt.compare(password, row[0]!.passwordHash);
  if (!ok) {
    throw new Error("invalid_credentials");
  }

  const token = signToken({
    id: row[0]!.userId,
    email: row[0]!.email,
    role: row[0]!.role,
  });

  return {
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

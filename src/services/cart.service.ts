import { randomUUID } from "node:crypto";
import { db, carts } from "../db/index.js";
import { desc, eq } from "drizzle-orm";

export async function createCartService(userId: string) {
  const id = randomUUID();
  const now = new Date();

  return await db
    .insert(carts)
    .values({
      id,
      createdBy: userId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
}

export async function getCartsService(userId: string, role: string) {
  const rows = await db
    .select({
      id: carts.id,
      status: carts.status,
      createdAt: carts.createdAt,
      updatedAt: carts.updatedAt,
    })
    .from(carts)
    .where(role === "customer" ? eq(carts.createdBy, userId) : undefined)
    .orderBy(desc(carts.updatedAt));

  return rows;
}

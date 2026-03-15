import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { carts } from "../db/schema.js";

export async function getActiveCartByUserId(userId: string) {
  const cartRow = await db
    .select({ id: carts.id, status: carts.status, createdBy: carts.createdBy })
    .from(carts)
    .where(and(eq(carts.createdBy, userId), eq(carts.status, "active")))
    .limit(1);
  if (cartRow.length === 0) {
    return false;
  }
  return cartRow;
}

export async function getActiveCart(userId: string, cartId: string) {
  const cartRow = await db
    .select({ id: carts.id, status: carts.status, createdBy: carts.createdBy })
    .from(carts)
    .where(
      and(
        eq(carts.id, cartId),
        eq(carts.status, "active"),
        eq(carts.createdBy, userId),
      ),
    );

  if (cartRow.length === 0) {
    return false;
  }

  return cartRow;
}

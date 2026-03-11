import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders } from "../db/schema.js";
import type { UpdateOrderStatusSchema } from "../routes/orders.js";
import { date } from "zod";

export async function updateOrderStatusById(
  id: string,
  status: UpdateOrderStatusSchema["status"],
) {
  const [row] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, id), ne(orders.status, "delivered")))
    .returning();
  return row;
}

export async function getOrdersByUser(user: { id: string; role: string }) {
  const row = await db
    .select()
    .from(orders)
    .where(user.role !== "admin" ? eq(orders.userId, user.id) : undefined)
    .orderBy(
      sql`CASE
        WHEN ${orders.status} = 'delivered' THEN 1
        WHEN ${orders.status} = 'pending' THEN 2
        WHEN ${orders.status} = 'cancelled' THEN 3
    END`,
    );
  return row;
}

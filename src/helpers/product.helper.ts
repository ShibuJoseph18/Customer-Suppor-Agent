import { get } from "node:http";
import { db, orderLines, orders, products } from "../db/index.js";
import { eq } from "drizzle-orm";

export async function getProductById(id: string) {
  const row = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (row.length === 0) {
    return null;
  }

  return row[0];
}


export async function getProductByOrderId(id: string) {
  const row = await db
    .select()
    .from(products)
    .innerJoin(orderLines, eq(orderLines.productId, products.id))
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .where(eq(orders.id, id));

  if (row.length === 0) {
    return null;
  }

  return row[0];
}

getProductByOrderId("fea52a5a-0284-47c6-a3cd-7df22c268299")
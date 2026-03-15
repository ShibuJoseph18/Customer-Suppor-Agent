import { randomUUID } from "node:crypto";
import { db, orders, orderLines, carts } from "../db/index.js";
import { eq } from "drizzle-orm";
import { getActiveCart } from "../helpers/cart.helper.js";
import { getCartItemsByCartId } from "../helpers/cartItems.helper.js";
import { getOrdersByUser, updateOrderStatusById } from "../helpers/order.helper.js";
import type { UpdateOrderStatusSchema } from "../routes/orders.js";


export async function createOrderService(userId: string, cartId: string) {
  const cartRow = await getActiveCart(userId, cartId);

  if (!cartRow) {
    throw new Error("cart_not_found");
  }

  const cartItems = await getCartItemsByCartId(cartId);

  if (!cartItems) {
    throw new Error("cart_items_not_found");
  }

  const orderId = randomUUID();
  const now = new Date();

  await db.insert(orders).values({
    id: orderId,
    userId,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(orderLines).values(
    cartItems.map((item) => ({
      id: randomUUID(),
      orderId,
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
    })),
  );

  await db
    .update(carts)
    .set({ status: "purchased", updatedAt: now })
    .where(eq(carts.id, cartId));

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    id: orderId,
    createdAt: now,
    total: Math.round(total * 100) / 100,
    itemCount: cartItems.reduce((s, i) => s + i.quantity, 0),
  };
}

export async function updateOrderStatusService(
  orderId: string,
  status: UpdateOrderStatusSchema["status"],
) {
  const order = await updateOrderStatusById(orderId, status);
  if (!order) {
    throw new Error("order already delivered or not found");
  }
  return order;
}

export async function getAllOrderService(userId: string, role:string) {
    const orders = await getOrdersByUser({ id: userId, role: role });
    return orders;
}

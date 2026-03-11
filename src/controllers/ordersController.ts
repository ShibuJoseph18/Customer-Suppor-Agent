import { randomUUID } from "node:crypto";
import type { Context } from "koa";
import { and, desc, eq, inArray, count } from "drizzle-orm";
import {
  db,
  orders,
  orderLines,
  products,
  carts,
  cartItems,
  reviews,
} from "../db/index.js";
import type { CreateOrderSchema } from "../routes/orders.js";
import { getActiveCartById } from "../helpers/cart.helper.js";
import { getCartItemsByCartId } from "../helpers/cartItems.helper.js";
import { getOrdersByUser, updateOrderStatusById } from "../helpers/order.helper.js";
import type { UpdateOrderStatusSchema } from "../routes/orders.js";

// ── POST /orders — create order from active cart ──────────────────────────────
export async function createOrder(ctx: Context) {
  const user = ctx.state.user!;
  const { cartId } = ctx.request.body as CreateOrderSchema;

  const cartRow = await getActiveCartById(cartId);

  if (!cartRow) {
    ctx.status = 404;
    ctx.body = { error: "cart_not_found" };
    return;
  }

  const cartItems = await getCartItemsByCartId(cartId);

  if (!cartItems) {
    ctx.status = 404;
    ctx.body = { error: "cart_items_not_found" };
    return;
  }

  const orderId = randomUUID();
  const now = new Date();

  await db.insert(orders).values({
    id: orderId,
    userId: user.id,
    createdAt: now,
    updatedAt: now
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

  // Mark cart as purchased
  await db
    .update(carts)
    .set({ status: "purchased", updatedAt: now })
    .where(eq(carts.id, cartId));

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  ctx.status = 201;
  ctx.body = {
    order: {
      id: orderId,
      createdAt: now,
      total: Math.round(total * 100) / 100,
      itemCount: cartItems.reduce((s, i) => s + i.quantity, 0),
    },
  };
}

export async function updateOrderStatus(ctx: Context) {
  const requestingUser = ctx.state.user!;
  if (requestingUser.role !== "admin") {
    ctx.status = 403;
    ctx.body = { error: "forbidden" };
    return;
  }

  const { orderId } = ctx.params;
  const { status } = ctx.request.body as UpdateOrderStatusSchema;

  const order = await updateOrderStatusById(orderId, status);
  if (!order) {
    ctx.status = 400;
    ctx.body = { success: false, message: "Order already delivered" };
    return;
  }
  ctx.status = 200;
  ctx.body = { success: true, order };
}

export async function getAllOrderOfUser(ctx: Context) {
  const user = ctx.state.user!;
  const orders = await getOrdersByUser({id: user.id, role: user.role});
  ctx.status = 200;
  ctx.body = {
    success: true,
    orders
  }
}

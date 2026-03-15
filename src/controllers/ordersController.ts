import type { Context } from "koa";
import type { CreateOrderSchema } from "../routes/orders.js";
import type { UpdateOrderStatusSchema } from "../routes/orders.js";
import {
  createOrderService,
  getAllOrderService,
  updateOrderStatusService,
} from "../services/order.service.js";

export async function createOrder(ctx: Context) {
  const user = ctx.state.user!;
  const { cartId } = ctx.request.body as CreateOrderSchema;

  const order = await createOrderService(user.id, cartId);

  ctx.body = {
    order,
  };
}

export async function updateOrderStatus(ctx: Context) {
  const requestingUser = ctx.state.user!;
  if (requestingUser.role !== "admin") {
    ctx.throw(403, "forbidden");
  }

  const { orderId } = ctx.params;
  const { status } = ctx.request.body as UpdateOrderStatusSchema;

  const order = await updateOrderStatusService(orderId, status);

  ctx.status = 200;
  ctx.body = { order };
}

export async function getAllOrderOfUser(ctx: Context) {
  const user = ctx.state.user!;
  const orders = await getAllOrderService(user.id, user.role);
  ctx.status = 200;
  ctx.body = {
    orders,
  };
}

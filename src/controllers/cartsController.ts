import type { Context } from "koa";
import {
  createCartService,
  getCartsService,
} from "../services/cart.service.js";

export async function getCarts(ctx: Context) {
  const user = ctx.state.user!;

  const carts = await getCartsService(user.id, user.role);

  ctx.body = { carts };
}


export async function createCart(ctx: Context) {
  const user = ctx.state.user!;
  const cart = await createCartService(user.id);
  ctx.status = 201;
  ctx.body = { cart };
}

import type { Context } from "koa";
import type { CreateCartItemInput } from "../routes/cartItems.js";
import { createCartItemService } from "../services/cartItems.service.js";

export async function createCartItem(ctx: Context) {
  const { cartId, productId, quantity } = ctx.request
    .body as CreateCartItemInput;

  const user = ctx.state.user!;

  const cartItem = await createCartItemService(cartId, productId, quantity, user.id);

  ctx.status = 201;
  ctx.body = { cartItem };
}

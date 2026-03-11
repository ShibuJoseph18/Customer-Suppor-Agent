import type { Context } from "koa";
import { eq, and } from "drizzle-orm";
import { db, cartItems } from "../db/index.js";
import type { CreateCartItemInput } from "../routes/cartItems.js";
import { getProductById } from "../helpers/product.helper.js";

export async function createCartItem(ctx: Context) {
  const { cartId, productId, quantity } = ctx.request
    .body as CreateCartItemInput;

  const product = await getProductById(productId);

  if (!product) {
    ctx.status = 404;
    ctx.body = { error: "product_not_found" };
    return;
  }


  const price = product.price * quantity;

  await db.insert(cartItems).values({
    cartId,
    productId,
    quantity,
    price,
    createdAt: new Date(),
  });

  const created = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
    )
    .limit(1);

  ctx.status = 201;
  ctx.body = { cartItem: created[0] };
}

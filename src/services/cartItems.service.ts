import type { Context } from "koa";
import { eq, and } from "drizzle-orm";
import { db, cartItems } from "../db/index.js";
import type { CreateCartItemInput } from "../routes/cartItems.js";
import { getProductById } from "../helpers/product.helper.js";
import {
  getActiveCart,
  getActiveCartByUserId,
} from "../helpers/cart.helper.js";

export async function createCartItemService(
  cartId: string,
  productId: string,
  quantity: number,
  userId: string,
) {
  const cart = getActiveCart(cartId, userId);
  if (!cart) {
    throw new Error("cart_not_found");
  }
  const product = await getProductById(productId);

  if (!product) {
    throw new Error("product_not_found");
  }

  const price = product.price * quantity;

  const cartItem = await db
    .insert(cartItems)
    .values({
      cartId,
      productId,
      quantity,
      price,
      createdAt: new Date(),
    })
    .returning();
    
  return cartItem;
}

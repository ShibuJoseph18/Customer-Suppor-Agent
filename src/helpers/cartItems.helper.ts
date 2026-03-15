 import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { cartItems } from "../db/schema.js";

export async function getCartItemsByCartId(cartId: string) {
  const cartRow = await db
    .select({
      id: cartItems.cartId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      price: cartItems.price,
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  if (cartRow.length === 0) {
    return false;
  }
  return cartRow;
}

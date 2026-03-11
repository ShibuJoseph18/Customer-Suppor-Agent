import type { Context } from "koa";
import { eq } from "drizzle-orm";
import { db, orderLines, products, orders, categories } from "../db/index.js";
import type { GetProductsByOrderSchema } from "../routes/products.js";
export async function getProductsByOrderId(ctx: Context) {
  const id = ctx.params.id as GetProductsByOrderSchema;

  const orderedProducts = await db
    .select()
    .from(products)
    .innerJoin(orderLines, eq(orderLines.productId, products.id))
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(orders.id, id));


  const finalResult = orderedProducts.map((item) => ({
    id: item.products.id,
    category: item.categories.name,
    title: item.products.title,
    summary: item.products.summary,
    description: item.products.description,
    price: item.products.price,
    quantity: item.order_lines.quantity,
    totalPrice: item.order_lines.price,
  }));

  ctx.status = 200;
  ctx.body = {
    success: true,
    products: finalResult,
  };
}

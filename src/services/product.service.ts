import { eq } from "drizzle-orm";
import { db, orderLines, products, orders, categories } from "../db/index.js";
export async function getProductsByOrderIdService(productId: string) {

  const orderedProducts = await db
    .select()
    .from(products)
    .innerJoin(orderLines, eq(orderLines.productId, products.id))
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(orders.id, productId));


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


  return {
    products: finalResult,
  };
}

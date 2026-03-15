import type { Context } from "koa";
import { getProductsByOrderIdService } from "../services/product.service.js";
export async function getProductsByOrderId(ctx: Context) {
  const id = ctx.params.id;

  const products = await getProductsByOrderIdService(id);

  ctx.status = 200;
  ctx.body = products;
}

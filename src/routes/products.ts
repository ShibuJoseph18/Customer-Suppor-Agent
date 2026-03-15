import Router from "@koa/router";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";
import { getProductsByOrderId } from "../controllers/productsController.js";

export const productsRouter = new Router();

const getProductsByOrderSchema = z.object({
  id: z.string(),
});

export type GetProductsByOrderSchema = z.infer<typeof getProductsByOrderSchema>;

productsRouter.get(
  "/products/order/:id",
  authMiddleware,
  validate(getProductsByOrderSchema, "params"),
  getProductsByOrderId,
);

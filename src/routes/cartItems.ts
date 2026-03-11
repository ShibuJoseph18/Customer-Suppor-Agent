import Router from "@koa/router";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCartItem } from "../controllers/cartItemsController.js";

const createCartItemSchema = z.object({
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number().min(1),
});

export type CreateCartItemInput = z.infer<typeof createCartItemSchema>;

export const cartItemsRouter = new Router();

cartItemsRouter.post("/cart-items", authMiddleware, validate(createCartItemSchema, "body"), createCartItem);
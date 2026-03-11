import Router from "@koa/router";
import { authMiddleware } from "../middleware/auth.js";
import {
  createOrder,
  updateOrderStatus,
  getAllOrderOfUser
} from "../controllers/ordersController.js";
import z from "zod";
import { validate } from "../middleware/validate.js";

export const ordersRouter = new Router();

const createOrderSchema = z.object({
  cartId: z.string(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["delivered", "cancelled"]),
});

export type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusSchema = z.infer<typeof updateOrderStatusSchema>;


// GET /orders  — list my orders with summary
ordersRouter.get("/orders", authMiddleware, getAllOrderOfUser);

// POST /orders  — checkout: convert active cart → order (no body needed)
ordersRouter.post("/orders", authMiddleware, validate(createOrderSchema, "body"), createOrder);

ordersRouter.patch("/orders/:orderId",authMiddleware, validate(updateOrderStatusSchema), updateOrderStatus);

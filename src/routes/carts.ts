import Router from "@koa/router";
import { authMiddleware } from "../middleware/auth.js";
import { getCarts, createCart } from "../controllers/cartsController.js";

export const cartsRouter = new Router();

// GET /carts  — list my carts
cartsRouter.get("/carts", authMiddleware, getCarts);

// POST /carts  — create a new cart
cartsRouter.post("/carts", authMiddleware, createCart);
 
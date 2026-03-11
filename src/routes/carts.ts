import Router from "@koa/router";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  getCarts,
  getActiveCart,
  createCart
} from "../controllers/cartsController.js";

export const cartsRouter = new Router();

// GET /carts  — list my carts
cartsRouter.get("/carts", authMiddleware, getCarts);

// GET /carts/me/active  — active cart with items
cartsRouter.get("/carts/active", authMiddleware, getActiveCart);

// POST /carts  — create a new cart
cartsRouter.post("/carts", authMiddleware, createCart);

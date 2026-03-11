import { randomUUID } from "node:crypto";
import type { Context } from "koa";
import { and, desc, eq } from "drizzle-orm";
import { db, carts } from "../db/index.js";
import { getActiveCartByUserId } from "../helpers/cart.helper.js";

// ── GET /carts/me — list user's carts ─────────────────────────────────────────
export async function getCarts(ctx: Context) {
  const user = ctx.state.user!;

  const rows = await db
    .select({
      id: carts.id,
      status: carts.status,
      createdAt: carts.createdAt,
      updatedAt: carts.updatedAt,
    })
    .from(carts)
    .where(user.role === "customer" ? eq(carts.createdBy, user.id) : undefined)
    .orderBy(desc(carts.updatedAt));

  ctx.body = { carts: rows };
}

// ── GET /carts/me/active — get the current active cart with items ──────────────
export async function getActiveCart(ctx: Context) {
  const user = ctx.state.user!;

  const cartRow = await db
    .select({
      id: carts.id,
      status: carts.status,
      createdAt: carts.createdAt,
      updatedAt: carts.updatedAt,
    })
    .from(carts)
    .where(and(eq(carts.createdBy, user.id), eq(carts.status, "active")))
    .orderBy(desc(carts.updatedAt))
    .limit(1);

  if (cartRow.length === 0) {
    ctx.body = { cart: null };
    return;
  }

  ctx.body = {
    cart: {
      id: cartRow[0]?.id,
    },
  };
}

// ── POST /carts — create new cart ─────────────────────────────────────────────
export async function createCart(ctx: Context) {
  const user = ctx.state.user!;

  const cartExists = await getActiveCartByUserId(user.id);
  if (cartExists) {
    ctx.status = 409;
    ctx.body = {
      message: "Cart already exists",
      cart: cartExists[0],
    };
    return;
  }

  const id = randomUUID();
  const now = new Date();

  await db.insert(carts).values({
    id,
    createdBy: user.id,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  ctx.status = 201;
  ctx.body = { cart: { id, status: "active", createdAt: now, updatedAt: now } };
}

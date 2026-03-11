import { randomUUID } from "node:crypto";
import type { Context } from "koa";
import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import { db, reviews, products, users } from "../db/index.js";

// ── GET /products/:id/reviews ─────────────────────────────────────────────────
export async function listProductReviews(ctx: Context) {
  const productId = ctx.params.productId as string;

  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (product.length === 0) {
    ctx.status = 404;
    ctx.body = { error: "product_not_found" };
    return;
  }

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  // Aggregate stats
  const stats = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  ctx.body = {
    reviews: rows,
    stats: {
      avgRating: Number(stats[0]?.avgRating ?? 0),
      totalReviews: stats[0]?.totalReviews ?? 0,
    },
  };
}

// ── POST /products/:id/reviews ────────────────────────────────────────────────
export async function createReview(ctx: Context) {
  const user = ctx.state.user!;
  const productId = ctx.params.productId as string;

  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (product.length === 0) {
    ctx.status = 404;
    ctx.body = { error: "product_not_found" };
    return;
  }

  // One review per user per product
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, user.id), eq(reviews.productId, productId)))
    .limit(1);

  if (existing.length > 0) {
    ctx.status = 409;
    ctx.body = { error: "review_already_exists" };
    return;
  }

  const { rating, comment } = (ctx.request as any).body as {
    rating: number;
    comment: string;
  };

  const id = randomUUID();
  const now = new Date();

  await db.insert(reviews).values({
    id,
    userId: user.id,
    productId,
    rating,
    comment,
    createdAt: now,
  });

  ctx.status = 201;
  ctx.body = { review: { id, userId: user.id, productId, rating, comment, createdAt: now } };
}
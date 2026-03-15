import { randomUUID } from "node:crypto";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { db, reviews, products, users } from "../db/index.js";
import type { createReviewSchema } from "../routes/reviews.js";

export async function listProductReviewsService(productId: string) {
  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (product.length === 0) {
    throw new Error("product_not_found");
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

  return {
    reviews: rows,
    stats: {
      avgRating: Number(stats[0]?.avgRating ?? 0),
      totalReviews: stats[0]?.totalReviews ?? 0,
    },
  };
}

export async function createReviewService(
  userId: string,
  productId: string,
  impression: createReviewSchema,
) {
  const product = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (product.length === 0) {
    throw new Error("product_not_found");
  }

  // One review per user per product
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("review_already_exists");
    return;
  }

  const { rating, comment } = impression;

  const id = randomUUID();
  const now = new Date();

  await db.insert(reviews).values({
    id,
    userId: userId,
    productId,
    rating,
    comment,
    createdAt: now,
  });

  return {
    review: { id, userId: user.id, productId, rating, comment, createdAt: now },
  };
}

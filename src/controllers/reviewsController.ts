import type { Context } from "koa";
import {
  createReviewService,
  listProductReviewsService,
} from "../services/review.service.js";
import type { createReviewSchema } from "../routes/reviews.js";

export async function listProductReviews(ctx: Context) {
  const productId = ctx.params.productId;
  const reviews = await listProductReviewsService(productId);
  ctx.status = 201;
  ctx.body = reviews;
}

export async function createReview(ctx: Context) {
  const user = ctx.state.user!;
  const productId = ctx.params.productId as string;
  const impression = ctx.request.body as createReviewSchema;
  const review = await createReviewService(user.id, productId, impression);

  ctx.status = 201;
  ctx.body = review;
}

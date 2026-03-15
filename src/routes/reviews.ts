import Router from "@koa/router";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  listProductReviews,
  createReview,
} from "../controllers/reviewsController.js";

export const reviewsRouter = new Router();

const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(1, "Comment is required").max(2000),
});

const productIdSchema = z.object({
  productId: z.string(),
});

export type createReviewSchema = z.infer<typeof createReviewSchema>;
export type ProductIdSchema = z.infer<typeof productIdSchema>;

reviewsRouter.get(
  "/products/:productId/reviews",
  authMiddleware,
  validate(productIdSchema, "params"),
  listProductReviews,
);

reviewsRouter.post(
  "/products/:productId/reviews",
  authMiddleware,
  validate(createReviewSchema, "body"),
  createReview,
);

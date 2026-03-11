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
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(1, "Comment is required").max(2000),
});

// GET /products/:productId/reviews  — public
reviewsRouter.get("/products/:productId/reviews", listProductReviews);

// POST /products/:productId/reviews  — authenticated
reviewsRouter.post(
  "/products/:productId/reviews",
  authMiddleware,
  validate(createReviewSchema),
  createReview
);
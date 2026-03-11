import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "@koa/router";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { cartsRouter } from "./routes/carts.js";
import { ordersRouter } from "./routes/orders.js";
import { reviewsRouter } from "./routes/reviews.js";
import { cartItemsRouter } from "./routes/cartItems.js";

export const app = new Koa();

const rootRouter = new Router();

rootRouter.get("/health", (ctx) => {
  ctx.body = { status: "ok" };
});

app.use(bodyParser());

app.use(rootRouter.routes()).use(rootRouter.allowedMethods());
app.use(authRouter.routes()).use(authRouter.allowedMethods());
app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(cartsRouter.routes()).use(cartsRouter.allowedMethods());
app.use(ordersRouter.routes()).use(ordersRouter.allowedMethods());
app.use(reviewsRouter.routes()).use(reviewsRouter.allowedMethods());
app.use(cartItemsRouter.routes()).use(cartItemsRouter.allowedMethods());
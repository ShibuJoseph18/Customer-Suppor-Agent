import Koa from "koa";
import Router from "@koa/router";
export const app = new Koa();

const router = new Router();

router.get("/health", (ctx) => {
  ctx.body = {
    status: "ok",
  }
})

app.use(router.routes()).use(router.allowedMethods())
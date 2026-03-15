import type { Context, Next } from "koa";
export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next(); // run next middleware
  } catch (err: any) {
    console.error("errorhandler", err);

    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || "Internal Server Error",
    };

    ctx.app.emit("error", err, ctx);
  }
}

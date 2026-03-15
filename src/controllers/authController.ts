import type { Context } from "koa";
import type { LoginSchema, RegisterSchema } from "../routes/auth.js";
import { loginService, registerService } from "../services/auth.service.js";

export async function register(ctx: Context) {
  const user = await registerService(ctx.request.body as RegisterSchema);
  ctx.status = 201;
  ctx.body = user;
}

export async function login(ctx: Context) {
  const user = await loginService(ctx.request.body as LoginSchema);

  ctx.status = 201;
  ctx.body = user;
}

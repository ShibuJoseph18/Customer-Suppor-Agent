import jwt from "jsonwebtoken";
import type { Middleware } from "koa";
import { config } from "../config/config.js";

export type AuthUser = {
  id: string;
  email: string;
  role: "customer" | "admin" | "support" | "vendor";
};

export const authMiddleware: Middleware = async (ctx, next) => {
  const header = ctx.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    ctx.status = 401;
    ctx.body = { error: "missing_bearer_token" };
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret, {
      issuer: config.auth.jwtIssuer,
    }) as jwt.JwtPayload;

    const id = payload.sub;
    const email = payload.email;
    const role = payload.role;
    if (
      typeof id !== "string" ||
      typeof email !== "string" ||
      (role !== "customer" &&
        role !== "admin" &&
        role !== "support" &&
        role !== "vendor")
    ) {
      ctx.status = 401;
      ctx.body = { error: "invalid_token" };
      return;
    }

    ctx.state.user = { id, email, role } satisfies AuthUser;
    await next();
  } catch (error){
    ctx.status = 401;
    ctx.body = { error: "invalid_token" };
  }
};

declare module "koa" {
  interface DefaultState {
    user?: AuthUser;
  }
}


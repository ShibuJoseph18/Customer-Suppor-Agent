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
    ctx.throw(401, "missing_bearer_token");
  }

  const token = header.slice("Bearer ".length).trim();
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
    // throw new Error();
    ctx.throw(400, "invalid_token");
  }

  ctx.state.user = { id, email, role } as AuthUser;
  await next();
};

declare module "koa" {
  interface DefaultState {
    user?: AuthUser;
  }
}

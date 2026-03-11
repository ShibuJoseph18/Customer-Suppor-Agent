import type { Middleware } from "koa";
import { z } from "zod";
import type { ZodSchema } from "zod";

type ValidateTarget = "body" | "query" | "params";

/**
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   router.post("/endpoint", validate(MySchema), controller)
 *   router.get("/endpoint", validate(MySchema, "query"), controller)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = "body"): Middleware {
  return async (ctx, next) => {
    let data: unknown;

    if (target === "body") {
      data = (ctx.request as any).body;
    } else if (target === "query") {
      data = ctx.query;
    } else {
      data = ctx.params;
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      ctx.status = 422;
      ctx.body = {
        error: "validation_error",
        issues: (result.error as z.ZodError).issues.map((issue: z.ZodIssue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
      return;
    }

    // Attach parsed/coerced data back so controllers can use it safely
    if (target === "body") {
      (ctx.request as any).body = result.data;
    } else if (target === "query") {
      (ctx as any).validatedQuery = result.data;
    } else {
      (ctx as any).validatedParams = result.data;
    }

    await next();
  };
}

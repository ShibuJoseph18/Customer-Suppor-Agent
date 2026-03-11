import Router from "@koa/router";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { register, login } from "../controllers/authController.js";

export const authRouter = new Router({ prefix: "/auth" });

const registerSchema = z
  .object({
    name: z.string().min(1).max(120).trim(),
    email: z.email().trim(),
    password: z.string().min(8).trim(),
    role: z.enum(["admin", "customer"]).default("customer"),
    secretKey: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "admin") {
        return data.secretKey === "123";
      }
      return true;
    },
    {
      message: "Secret key is required for admin role",
      path: ["secretKey"],
    },
  );

export type RegisterSchema = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  email: z.email("Invalid email address").trim(),
  password: z.string().min(1, "Password is required").trim(),
});

// POST /auth/register
authRouter.post("/register", validate(registerSchema, "body"), register);

// POST /auth/login
authRouter.post("/login", validate(loginSchema, "body"), login);

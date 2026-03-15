import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export function signToken(input: { id: string; email: string; role: string }) {
  return jwt.sign(
    { email: input.email, role: input.role },
    config.auth.jwtSecret,
    {
      subject: input.id,
      issuer: config.auth.jwtIssuer,
      expiresIn: "7d",
    },
  );
}

import dotenv from "dotenv"
dotenv.config({quiet: true})

export const config = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL ?? "./data/sqlite.db",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    jwtIssuer: process.env.JWT_ISSUER ?? "customer-support-agent",
  },
};
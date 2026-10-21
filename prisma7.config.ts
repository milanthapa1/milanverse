import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI config.
 *
 * Migrations always use DIRECT_URL (Neon's non-pooled endpoint) — running
 * `prisma migrate` through the pooler can hold transactions open and break
 * pooled clients. The runtime app uses DATABASE_URL (pooled) instead.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});

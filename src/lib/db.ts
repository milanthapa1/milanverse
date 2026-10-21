import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client singleton (Prisma 7 + pg driver adapter).
 *
 * Every query in the app MUST be scoped by the session userId — this module
 * is never imported from client components (client code goes through route
 * handlers / server actions instead).
 *
 * When `DATABASE_URL` is missing or points at something non-postgres, the app
 * runs in "demo mode": data-access functions serve the seeded demo dataset
 * from `src/server/demo-data.ts` so the UI is fully usable without infra.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** True when a real Postgres connection string is configured. */
export function hasDatabase(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && (url.startsWith("postgres://") || url.startsWith("postgresql://"));
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/** Lazily-constructed singleton; `null` in demo mode. */
export function getPrisma(): PrismaClient | null {
  if (!hasDatabase()) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/** Convenience for call sites that already know a database is configured. */
export const db = {
  get client(): PrismaClient {
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database not configured (demo mode)");
    return prisma;
  },
};

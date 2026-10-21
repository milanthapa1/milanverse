import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest runs the pure library code (URL normalization, the SSRF guard and the
 * bookmark parser) in Node — no DOM, no database, no network.
 *
 * The `@/` alias mirrors the tsconfig path so tests import modules exactly the
 * way the app does.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

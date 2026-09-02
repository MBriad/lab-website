import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Minimal test setup: pure-logic seams (mock data layer, real client URL
 * building, format/text helpers, enum label maps) run in a plain node
 * environment — no browser, no framework runtime needed.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

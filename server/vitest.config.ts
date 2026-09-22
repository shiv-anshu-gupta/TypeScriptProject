import { defineConfig } from "vitest/config";

/**
 * Tests live beside the code they cover, as `*.test.ts`.
 *
 * `node` environment: nothing here touches a DOM. No global setup file and no
 * database - the tests that need one build their own fixture, so `npm test`
 * stays runnable on a laptop with no MONGO_URI.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    globals: true,
    hookTimeout: 30000,
    testTimeout: 30000,
    // Run test files sequentially so they share a single SQLite test database safely.
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true }
    }
  }
});

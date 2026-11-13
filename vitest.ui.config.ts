import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/feature-row.test.tsx"],
    environment: "jsdom",
    fileParallelism: false,
    testTimeout: 10_000,
  },
});

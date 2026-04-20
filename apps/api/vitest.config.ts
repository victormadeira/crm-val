import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.module.ts", "src/**/*.dto.ts", "src/main.ts"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

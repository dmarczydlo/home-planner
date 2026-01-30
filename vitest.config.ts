import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  cacheDir: "node_modules/.vitest",
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types.ts",
        "**/database.types.ts",
        "**/e2e/**",
        "**/*.spec.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

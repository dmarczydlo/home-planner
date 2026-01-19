import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Use Vite's cacheDir instead of deprecated test.cache.dir
  cacheDir: "node_modules/.vitest",
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    // Component tests use jsdom environment via @vitest-environment jsdom comment
    
    // Performance optimizations
    pool: "forks", // Use forks for better isolation and parallel execution
    poolOptions: {
      forks: {
        singleFork: false, // Allow parallel test execution
        minForks: 1,
        maxForks: 4, // Limit to 4 parallel workers
      },
    },
    testTimeout: 5000, // 5 second timeout for tests (reduced from 10s)
    hookTimeout: 5000, // 5 second timeout for hooks (reduced from 10s)
    isolate: true, // Isolate tests for better reliability
    
    // Type checking configuration
    typecheck: {
      tsconfig: "./tsconfig.json",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
    
    // Coverage configuration
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
        "**/test/**",
        "**/e2e/**",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});


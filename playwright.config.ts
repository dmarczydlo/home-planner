import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const testEnv = process.env.TEST_ENV || (isCI ? "mock" : "mock");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: testEnv === "mock",
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: testEnv === "mock" ? 4 : 1,
  reporter: isCI ? "github" : "html",

  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Isolate browser contexts for each test
    contextOptions: {
      // Clear storage state for each test
      storageState: undefined,
    },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Ensure isolated browser contexts
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4321",
    reuseExistingServer: !isCI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
});

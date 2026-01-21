import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const testEnv = process.env.TEST_ENV || (isCI ? "mock" : "mock");
const AUTH_FILE = ".auth/user.json";

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
  },

  projects: [
    // Setup project: Authenticate once and save storage state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Main test project: Use saved storage state for authenticated tests
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        // Use storage state for authenticated tests
        // If auth file doesn't exist, tests will need to handle authentication
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
    // Unauthenticated tests (if needed)
    {
      name: "chromium-unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        storageState: undefined, // No authentication
      },
      testMatch: /.*\.unauthenticated\.spec\.ts/,
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

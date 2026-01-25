import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const testEnv = process.env.TEST_ENV || (isCI ? "mock" : "mock");
const AUTH_FILE = ".auth/user.json";

// Validate required environment variables for integration tests
if (testEnv === "integration") {
  const requiredVars = [
    { name: "PUBLIC_SUPABASE_URL", secret: "PUBLIC_SUPABASE_URL" },
    { name: "PUBLIC_SUPABASE_ANON_KEY", secret: "PUBLIC_SUPABASE_ANON_KEY" },
  ];

  const missingVars = requiredVars.filter(({ name }) => {
    const value = process.env[name];
    return !value || value.trim() === "";
  });

  if (missingVars.length > 0) {
    const missingNames = missingVars.map(({ name }) => name).join(", ");
    const secretNames = missingVars.map(({ secret }) => secret).join(", ");
    throw new Error(
      `Missing required environment variables for integration tests: ${missingNames}\n` +
        `Please set these secrets in your GitHub repository:\n` +
        `  - ${secretNames}\n` +
        `These should be configured in: Settings > Secrets and variables > Actions > Secrets`
    );
  }
}

// Get environment variables with fallbacks
const getEnvVar = (name: string, fallback?: string): string | undefined => {
  const value = process.env[name] || fallback;
  return value && value !== "" ? value : undefined;
};

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
    env: Object.fromEntries(
      Object.entries({
        // Use PUBLIC_ prefixed vars as primary, fallback to non-prefixed
        SUPABASE_URL: getEnvVar("SUPABASE_URL", process.env.PUBLIC_SUPABASE_URL),
        SUPABASE_KEY: getEnvVar("SUPABASE_KEY", process.env.PUBLIC_SUPABASE_ANON_KEY),
        PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        TEST_GOOGLE_EMAIL: process.env.TEST_GOOGLE_EMAIL,
        TEST_ENV: process.env.TEST_ENV,
      })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([, value]) => value !== undefined && value !== "")
    ),
  },
});

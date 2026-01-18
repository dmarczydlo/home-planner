import { afterEach, vi } from "vitest";

// Global test setup
// This file runs before all tests

// Mock environment variables if needed
process.env.NODE_ENV = process.env.NODE_ENV || "test";

// Global mocks can be defined here
// Example: Mock Supabase client for tests that don't need real DB
// vi.mock("@/db/supabase.client", () => ({
//   createClient: vi.fn(),
// }));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

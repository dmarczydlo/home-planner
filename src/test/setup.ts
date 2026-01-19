import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import "@testing-library/jest-dom/vitest";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

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
  cleanup();
});

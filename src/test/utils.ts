// Test utilities and helpers
// Reusable test functions and mocks

import { vi } from "vitest";

/**
 * Creates a mock function with proper typing
 */
export function createMockFn<T extends (...args: any[]) => any>() {
  return vi.fn<T>();
}

/**
 * Creates a delay for testing async behavior
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a test user object
 */
export function createTestUser(overrides?: Partial<{ id: string; email: string; full_name: string }>) {
  return {
    id: "test-user-123",
    email: "test@example.com",
    full_name: "Test User",
    ...overrides,
  };
}

/**
 * Creates a test family object
 */
export function createTestFamily(overrides?: Partial<{ id: string; name: string; created_by: string }>) {
  return {
    id: "test-family-123",
    name: "Test Family",
    created_by: "test-user-123",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

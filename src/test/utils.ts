import { vi } from "vitest";

export function createMockFn<T extends (...args: any[]) => any>() {
  return vi.fn<T>();
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTestUser(overrides?: Partial<{ id: string; email: string; full_name: string }>) {
  return {
    id: "test-user-123",
    email: "test@example.com",
    full_name: "Test User",
    ...overrides,
  };
}

export function createTestFamily(overrides?: Partial<{ id: string; name: string; created_by: string }>) {
  return {
    id: "test-family-123",
    name: "Test Family",
    created_by: "test-user-123",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

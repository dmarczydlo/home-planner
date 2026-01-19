import type { UserEntity, FamilyEntity, ChildEntity, EventEntity } from "@/types";

/**
 * Creates a mock user object for testing
 */
export function createMockUser(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: "test-user-123",
    email: "test@example.com",
    full_name: "Test User",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock family object for testing
 */
export function createMockFamily(overrides?: Partial<FamilyEntity>): FamilyEntity {
  return {
    id: "test-family-123",
    name: "Test Family",
    created_by: "test-user-123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock child object for testing
 */
export function createMockChild(overrides?: Partial<ChildEntity>): ChildEntity {
  return {
    id: "test-child-123",
    family_id: "test-family-123",
    name: "Test Child",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock event object for testing
 */
export function createMockEvent(overrides?: Partial<EventEntity>): EventEntity {
  const now = new Date();
  const endTime = new Date(now.getTime() + 3600000); // 1 hour later

  return {
    id: "test-event-123",
    family_id: "test-family-123",
    title: "Test Event",
    description: null,
    start_time: now.toISOString(),
    end_time: endTime.toISOString(),
    is_all_day: false,
    event_type: "elastic",
    recurrence_pattern: null,
    recurrence_end_date: null,
    created_by: "test-user-123",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple mock events for testing
 */
export function createMockEvents(count: number, overrides?: Partial<EventEntity>): EventEntity[] {
  return Array.from({ length: count }, (_, index) =>
    createMockEvent({
      id: `test-event-${index + 1}`,
      title: `Test Event ${index + 1}`,
      ...overrides,
    })
  );
}

/**
 * Creates a mock family member object for testing
 */
export function createMockFamilyMember(overrides?: {
  user_id?: string;
  family_id?: string;
  role?: "admin" | "member";
}) {
  return {
    user_id: overrides?.user_id || "test-user-123",
    family_id: overrides?.family_id || "test-family-123",
    role: overrides?.role || "member",
    joined_at: new Date().toISOString(),
  };
}

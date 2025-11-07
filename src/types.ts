/**
 * DTOs (Data Transfer Objects) and Command Models for Home Planner API
 *
 * This file contains Zod schemas and TypeScript types for all data structures
 * used in API requests and responses. All DTOs are derived from the database
 * entity definitions in src/db/database.types.ts to maintain type safety and
 * consistency with the database schema.
 *
 * Zod schemas provide:
 * - Runtime validation for API requests
 * - Type inference for TypeScript
 * - Reusable validation logic
 * - Clear validation error messages
 */

import { z } from "zod";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

/**
 * Database Row types - representing actual database records
 */
export type UserEntity = Tables<"users">;
export type FamilyEntity = Tables<"families">;
export type FamilyMemberEntity = Tables<"family_members">;
export type ChildEntity = Tables<"children">;
export type EventEntity = Tables<"events">;
export type EventParticipantEntity = Tables<"event_participants">;
export type EventExceptionEntity = Tables<"event_exceptions">;
export type ExternalCalendarEntity = Tables<"external_calendars">;
export type InvitationEntity = Tables<"invitations">;
export type LogEntity = Tables<"logs">;

/**
 * Database Insert types - for creating new records
 */
export type UserInsert = TablesInsert<"users">;
export type FamilyInsert = TablesInsert<"families">;
export type FamilyMemberInsert = TablesInsert<"family_members">;
export type ChildInsert = TablesInsert<"children">;
export type EventInsert = TablesInsert<"events">;
export type EventParticipantInsert = TablesInsert<"event_participants">;
export type EventExceptionInsert = TablesInsert<"event_exceptions">;
export type ExternalCalendarInsert = TablesInsert<"external_calendars">;
export type InvitationInsert = TablesInsert<"invitations">;
export type LogInsert = TablesInsert<"logs">;

/**
 * Database Update types - for updating existing records
 */
export type UserUpdate = TablesUpdate<"users">;
export type FamilyUpdate = TablesUpdate<"families">;
export type FamilyMemberUpdate = TablesUpdate<"family_members">;
export type ChildUpdate = TablesUpdate<"children">;
export type EventUpdate = TablesUpdate<"events">;
export type EventParticipantUpdate = TablesUpdate<"event_participants">;
export type EventExceptionUpdate = TablesUpdate<"event_exceptions">;
export type ExternalCalendarUpdate = TablesUpdate<"external_calendars">;
export type InvitationUpdate = TablesUpdate<"invitations">;
export type LogUpdate = TablesUpdate<"logs">;

/**
 * Database Enum types
 */
export type EventType = Enums<"event_type_enum">; // 'elastic' | 'blocker'
export type FamilyRole = Enums<"family_role_enum">; // 'admin' | 'member'
export type InvitationStatus = Enums<"invitation_status_enum">; // 'pending' | 'accepted' | 'expired'
export type ActorType = Enums<"actor_type_enum">; // 'user' | 'system'

// ============================================================================
// Base Zod Schemas (Reusable primitives)
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid();

/**
 * ISO8601 timestamp validation schema
 */
export const timestampSchema = z.string().datetime();

/**
 * ISO8601 date validation schema
 */
export const dateSchema = z.string().date();

/**
 * Email validation schema
 */
export const emailSchema = z.string().email();

/**
 * Event type enum schema
 */
export const eventTypeSchema = z.enum(["elastic", "blocker"]);

/**
 * Family role enum schema
 */
export const familyRoleSchema = z.enum(["admin", "member"]);

/**
 * Invitation status enum schema
 */
export const invitationStatusSchema = z.enum(["pending", "accepted", "expired"]);

/**
 * Actor type enum schema
 */
export const actorTypeSchema = z.enum(["user", "system"]);

/**
 * Participant type enum schema
 */
export const participantTypeSchema = z.enum(["user", "child"]);

/**
 * Calendar provider enum schema
 */
export const calendarProviderSchema = z.enum(["google", "microsoft"]);

/**
 * Calendar sync status enum schema
 */
export const calendarSyncStatusSchema = z.enum(["active", "error"]);

/**
 * Event update scope enum schema
 */
export const eventUpdateScopeSchema = z.enum(["this", "future", "all"]);

/**
 * Recurrence frequency enum schema
 */
export const recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly"]);

// ============================================================================
// Shared/Common Schemas
// ============================================================================

/**
 * Pagination metadata schema
 */
export const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  has_more: z.boolean(),
});

export type PaginationDTO = z.infer<typeof paginationSchema>;

/**
 * Validation error schema
 */
export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ValidationErrorDTO = z.infer<typeof validationErrorSchema>;

/**
 * Standard error response schema
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponseDTO = z.infer<typeof errorResponseSchema>;

// ============================================================================
// User Schemas
// ============================================================================

/**
 * Base User DTO schema
 */
export const userSchema = z.object({
  id: uuidSchema,
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  updated_at: timestampSchema.nullable(),
});

export type UserDTO = z.infer<typeof userSchema>;

/**
 * User summary schema (for lists)
 */
export const userSummarySchema = z.object({
  id: uuidSchema,
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
});

export type UserSummaryDTO = z.infer<typeof userSummarySchema>;

/**
 * User family membership schema
 */
export const userFamilyMembershipSchema = z.object({
  family_id: uuidSchema,
  family_name: z.string(),
  role: familyRoleSchema,
  joined_at: timestampSchema,
});

export type UserFamilyMembershipDTO = z.infer<typeof userFamilyMembershipSchema>;

/**
 * Extended user profile with families
 */
export const userProfileSchema = userSchema.extend({
  families: z.array(userFamilyMembershipSchema),
});

export type UserProfileDTO = z.infer<typeof userProfileSchema>;

/**
 * Command: Update user profile
 */
export const updateUserCommandSchema = z
  .object({
    full_name: z.string().max(100).optional(),
    avatar_url: z.string().url().optional(),
  })
  .strict();

export type UpdateUserCommand = z.infer<typeof updateUserCommandSchema>;

/**
 * Response: List users
 */
export const listUsersResponseSchema = z.object({
  users: z.array(userSummarySchema),
});

export type ListUsersResponseDTO = z.infer<typeof listUsersResponseSchema>;

// ============================================================================
// Family Schemas
// ============================================================================

/**
 * Base Family DTO schema
 */
export const familySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  created_at: timestampSchema,
});

export type FamilyDTO = z.infer<typeof familySchema>;

/**
 * Command: Create family
 */
export const createFamilyCommandSchema = z
  .object({
    name: z.string().trim().min(1, "Family name is required").max(100, "Family name must be less than 100 characters"),
  })
  .strict();

export type CreateFamilyCommand = z.infer<typeof createFamilyCommandSchema>;

/**
 * Response: Create family
 */
export const createFamilyResponseSchema = familySchema.extend({
  role: familyRoleSchema,
});

export type CreateFamilyResponseDTO = z.infer<typeof createFamilyResponseSchema>;

/**
 * Family member with details
 */
export const familyMemberSchema = z.object({
  user_id: uuidSchema,
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  role: familyRoleSchema,
  joined_at: timestampSchema,
});

export type FamilyMemberDTO = z.infer<typeof familyMemberSchema>;

/**
 * Response: List family members
 */
export const listFamilyMembersResponseSchema = z.object({
  members: z.array(familyMemberSchema),
});

export type ListFamilyMembersResponseDTO = z.infer<typeof listFamilyMembersResponseSchema>;

/**
 * Child schema (forward reference for family details)
 */
export const childSchema = z.object({
  id: uuidSchema,
  family_id: uuidSchema,
  name: z.string().min(1).max(100),
  created_at: timestampSchema,
});

export type ChildDTO = z.infer<typeof childSchema>;

/**
 * Detailed family information
 */
export const familyDetailsSchema = familySchema.extend({
  members: z.array(familyMemberSchema),
  children: z.array(childSchema),
});

export type FamilyDetailsDTO = z.infer<typeof familyDetailsSchema>;

/**
 * Command: Update family
 */
export const updateFamilyCommandSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Family name cannot be empty")
      .max(100, "Family name must be less than 100 characters")
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateFamilyCommand = z.infer<typeof updateFamilyCommandSchema>;

/**
 * Response: Update family
 */
export const updateFamilyResponseSchema = familySchema.extend({
  updated_at: timestampSchema,
});

export type UpdateFamilyResponseDTO = z.infer<typeof updateFamilyResponseSchema>;

/**
 * Command: Update member role
 */
export const updateMemberRoleCommandSchema = z
  .object({
    role: familyRoleSchema,
  })
  .strict();

export type UpdateMemberRoleCommand = z.infer<typeof updateMemberRoleCommandSchema>;

/**
 * Response: Update member role
 */
export const updateMemberRoleResponseSchema = z.object({
  family_id: uuidSchema,
  user_id: uuidSchema,
  role: familyRoleSchema,
  joined_at: timestampSchema,
});

export type UpdateMemberRoleResponseDTO = z.infer<typeof updateMemberRoleResponseSchema>;

// ============================================================================
// Child Schemas
// ============================================================================

/**
 * Command: Create child
 */
export const createChildCommandSchema = z
  .object({
    name: z.string().trim().min(1, "Child name is required").max(100, "Child name must be less than 100 characters"),
  })
  .strict();

export type CreateChildCommand = z.infer<typeof createChildCommandSchema>;

/**
 * Command: Update child
 */
export const updateChildCommandSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Child name cannot be empty")
      .max(100, "Child name must be less than 100 characters")
      .optional(),
  })
  .strict();

export type UpdateChildCommand = z.infer<typeof updateChildCommandSchema>;

/**
 * Response: Update child
 */
export const updateChildResponseSchema = childSchema.extend({
  updated_at: timestampSchema,
});

export type UpdateChildResponseDTO = z.infer<typeof updateChildResponseSchema>;

/**
 * Response: List children
 */
export const listChildrenResponseSchema = z.object({
  children: z.array(childSchema),
});

export type ListChildrenResponseDTO = z.infer<typeof listChildrenResponseSchema>;

// ============================================================================
// Event Schemas
// ============================================================================

/**
 * Recurrence pattern schema
 */
export const recurrencePatternSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().positive().default(1),
  end_date: dateSchema,
});

export type RecurrencePatternDTO = z.infer<typeof recurrencePatternSchema>;

/**
 * Event participant schema
 */
export const eventParticipantSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: participantTypeSchema,
  avatar_url: z.string().url().nullable().optional(),
});

export type EventParticipantDTO = z.infer<typeof eventParticipantSchema>;

/**
 * Participant reference schema (for create/update)
 */
export const participantReferenceSchema = z.object({
  id: uuidSchema,
  type: participantTypeSchema,
});

export type ParticipantReferenceDTO = z.infer<typeof participantReferenceSchema>;

/**
 * Base Event DTO schema
 */
export const eventSchema = z.object({
  id: uuidSchema,
  family_id: uuidSchema,
  title: z.string().min(1).max(200),
  start_time: timestampSchema,
  end_time: timestampSchema,
  is_all_day: z.boolean(),
  event_type: eventTypeSchema,
  recurrence_pattern: recurrencePatternSchema.nullable(),
  is_synced: z.boolean(),
  external_calendar_id: uuidSchema.nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema.nullable(),
});

export type EventDTO = z.infer<typeof eventSchema>;

/**
 * Event with participants schema
 */
export const eventWithParticipantsSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
  has_conflict: z.boolean(),
});

export type EventWithParticipantsDTO = z.infer<typeof eventWithParticipantsSchema>;

/**
 * Event exception schema
 */
export const eventExceptionSchema = z.object({
  id: uuidSchema,
  original_date: timestampSchema,
  new_start_time: timestampSchema.nullable(),
  new_end_time: timestampSchema.nullable(),
  is_cancelled: z.boolean(),
});

export type EventExceptionDTO = z.infer<typeof eventExceptionSchema>;

/**
 * Detailed event schema
 */
export const eventDetailsSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
  exceptions: z.array(eventExceptionSchema),
});

export type EventDetailsDTO = z.infer<typeof eventDetailsSchema>;

/**
 * Command: Create event
 */
export const createEventCommandSchema = z
  .object({
    family_id: uuidSchema,
    title: z.string().min(1, "Event title is required").max(200),
    start_time: timestampSchema,
    end_time: timestampSchema,
    is_all_day: z.boolean().default(false),
    event_type: eventTypeSchema.default("elastic"),
    recurrence_pattern: recurrencePatternSchema.optional(),
    participants: z.array(participantReferenceSchema).optional(),
  })
  .strict()
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "End time must be after start time",
    path: ["end_time"],
  })
  .refine(
    (data) => {
      if (!data.recurrence_pattern) return true;
      return new Date(data.recurrence_pattern.end_date) > new Date(data.start_time);
    },
    {
      message: "Recurrence end date must be after start time",
      path: ["recurrence_pattern", "end_date"],
    }
  );

export type CreateEventCommand = z.infer<typeof createEventCommandSchema>;

/**
 * Response: Create event
 */
export const createEventResponseSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
});

export type CreateEventResponseDTO = z.infer<typeof createEventResponseSchema>;

/**
 * Command: Update event
 */
export const updateEventCommandSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    start_time: timestampSchema.optional(),
    end_time: timestampSchema.optional(),
    is_all_day: z.boolean().optional(),
    event_type: eventTypeSchema.optional(),
    recurrence_pattern: recurrencePatternSchema.optional(),
    participants: z.array(participantReferenceSchema).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      return new Date(data.end_time) > new Date(data.start_time);
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

export type UpdateEventCommand = z.infer<typeof updateEventCommandSchema>;

/**
 * Response: Update event
 */
export const updateEventResponseSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
  exception_created: z.boolean().optional(),
});

export type UpdateEventResponseDTO = z.infer<typeof updateEventResponseSchema>;

/**
 * Response: List events
 */
export const listEventsResponseSchema = z.object({
  events: z.array(eventWithParticipantsSchema),
  pagination: paginationSchema,
});

export type ListEventsResponseDTO = z.infer<typeof listEventsResponseSchema>;

/**
 * Command: Validate event
 */
export const validateEventCommandSchema = z
  .object({
    family_id: uuidSchema,
    title: z.string().min(1, "Event title is required").max(200),
    start_time: timestampSchema,
    end_time: timestampSchema,
    is_all_day: z.boolean().optional(),
    event_type: eventTypeSchema,
    participants: z.array(participantReferenceSchema).optional(),
    exclude_event_id: uuidSchema.optional(),
  })
  .strict()
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export type ValidateEventCommand = z.infer<typeof validateEventCommandSchema>;

/**
 * Conflicting event schema
 */
export const conflictingEventSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  start_time: timestampSchema,
  end_time: timestampSchema,
  participants: z.array(eventParticipantSchema),
});

export type ConflictingEventDTO = z.infer<typeof conflictingEventSchema>;

/**
 * Response: Validation result
 */
export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(validationErrorSchema),
  conflicts: z.array(conflictingEventSchema),
});

export type ValidationResultDTO = z.infer<typeof validationResultSchema>;

/**
 * Event conflict error response
 */
export const eventConflictErrorSchema = errorResponseSchema.extend({
  conflicting_events: z.array(conflictingEventSchema),
});

export type EventConflictErrorDTO = z.infer<typeof eventConflictErrorSchema>;

// ============================================================================
// External Calendar Schemas
// ============================================================================

/**
 * External calendar summary schema
 */
export const externalCalendarSummarySchema = z.object({
  id: uuidSchema,
  provider: calendarProviderSchema,
  account_email: emailSchema,
  last_synced_at: timestampSchema.nullable(),
  created_at: timestampSchema,
  sync_status: calendarSyncStatusSchema,
  error_message: z.string().nullable().optional(),
});

export type ExternalCalendarSummaryDTO = z.infer<typeof externalCalendarSummarySchema>;

/**
 * Response: List external calendars
 */
export const listExternalCalendarsResponseSchema = z.object({
  calendars: z.array(externalCalendarSummarySchema),
});

export type ListExternalCalendarsResponseDTO = z.infer<typeof listExternalCalendarsResponseSchema>;

/**
 * Command: Connect calendar
 */
export const connectCalendarCommandSchema = z
  .object({
    provider: calendarProviderSchema,
  })
  .strict();

export type ConnectCalendarCommand = z.infer<typeof connectCalendarCommandSchema>;

/**
 * Response: Calendar auth
 */
export const calendarAuthResponseSchema = z.object({
  authorization_url: z.string().url(),
  state: z.string(),
});

export type CalendarAuthResponseDTO = z.infer<typeof calendarAuthResponseSchema>;

/**
 * Calendar sync result schema
 */
export const calendarSyncResultSchema = z.object({
  synced_at: timestampSchema,
  events_added: z.number().int().nonnegative(),
  events_updated: z.number().int().nonnegative(),
  events_removed: z.number().int().nonnegative(),
  status: z.enum(["success", "partial", "error"]),
  error_message: z.string().nullable().optional(),
});

export type CalendarSyncResultDTO = z.infer<typeof calendarSyncResultSchema>;

/**
 * Response: Sync all calendars
 */
export const syncAllCalendarsResponseSchema = z.object({
  results: z.array(
    calendarSyncResultSchema.extend({
      calendar_id: uuidSchema,
    })
  ),
});

export type SyncAllCalendarsResponseDTO = z.infer<typeof syncAllCalendarsResponseSchema>;

// ============================================================================
// Invitation Schemas
// ============================================================================

/**
 * Base invitation schema
 */
export const invitationSchema = z.object({
  id: uuidSchema,
  family_id: uuidSchema,
  invited_by: uuidSchema,
  invitee_email: emailSchema,
  token: z.string(),
  status: invitationStatusSchema,
  expires_at: timestampSchema,
  created_at: timestampSchema,
});

export type InvitationDTO = z.infer<typeof invitationSchema>;

/**
 * Invitation with inviter details
 */
export const invitationWithInviterSchema = z.object({
  id: uuidSchema,
  family_id: uuidSchema,
  invited_by: z.object({
    id: uuidSchema,
    full_name: z.string().max(100).nullable(),
  }),
  invitee_email: emailSchema,
  status: invitationStatusSchema,
  expires_at: timestampSchema,
  created_at: timestampSchema,
});

export type InvitationWithInviterDTO = z.infer<typeof invitationWithInviterSchema>;

/**
 * Response: List invitations
 */
export const listInvitationsResponseSchema = z.object({
  invitations: z.array(invitationWithInviterSchema),
});

export type ListInvitationsResponseDTO = z.infer<typeof listInvitationsResponseSchema>;

/**
 * Command: Create invitation
 */
export const createInvitationCommandSchema = z
  .object({
    invitee_email: emailSchema,
  })
  .strict();

export type CreateInvitationCommand = z.infer<typeof createInvitationCommandSchema>;

/**
 * Response: Create invitation
 */
export const createInvitationResponseSchema = invitationSchema.extend({
  invitation_url: z.string().url(),
});

export type CreateInvitationResponseDTO = z.infer<typeof createInvitationResponseSchema>;

/**
 * Public invitation details schema
 */
export const invitationDetailsSchema = z.object({
  id: uuidSchema,
  family: z.object({
    id: uuidSchema,
    name: z.string(),
  }),
  invited_by: z.object({
    full_name: z.string().max(100).nullable(),
  }),
  invitee_email: emailSchema,
  status: invitationStatusSchema,
  expires_at: timestampSchema,
  created_at: timestampSchema,
});

export type InvitationDetailsDTO = z.infer<typeof invitationDetailsSchema>;

/**
 * Response: Accept invitation
 */
export const acceptInvitationResponseSchema = z.object({
  family: z.object({
    id: uuidSchema,
    name: z.string(),
    role: familyRoleSchema,
  }),
});

export type AcceptInvitationResponseDTO = z.infer<typeof acceptInvitationResponseSchema>;

// ============================================================================
// Log (Audit Trail) Schemas
// ============================================================================

/**
 * Base log schema
 */
export const logSchema = z.object({
  id: z.number().int().positive(),
  family_id: uuidSchema.nullable(),
  actor_id: uuidSchema.nullable(),
  actor_type: actorTypeSchema,
  action: z.string(),
  details: z.record(z.string(), z.unknown()).nullable(),
  created_at: timestampSchema,
});

export type LogDTO = z.infer<typeof logSchema>;

/**
 * Response: List logs
 */
export const listLogsResponseSchema = z.object({
  logs: z.array(logSchema),
  pagination: paginationSchema,
});

export type ListLogsResponseDTO = z.infer<typeof listLogsResponseSchema>;

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a participant is a user
 */
export function isUserParticipant(
  participant: EventParticipantDTO
): participant is EventParticipantDTO & { type: "user" } {
  return participant.type === "user";
}

/**
 * Type guard to check if a participant is a child
 */
export function isChildParticipant(
  participant: EventParticipantDTO
): participant is EventParticipantDTO & { type: "child" } {
  return participant.type === "child";
}

/**
 * Type guard to check if event has recurrence pattern
 */
export function isRecurringEvent(event: EventDTO): event is EventDTO & {
  recurrence_pattern: RecurrencePatternDTO;
} {
  return event.recurrence_pattern !== null;
}

/**
 * Type guard to check if invitation is pending
 */
export function isPendingInvitation(invitation: InvitationDTO | InvitationWithInviterDTO): boolean {
  return invitation.status === "pending";
}

/**
 * Type guard to check if user is admin
 */
export function isAdmin(role: FamilyRole): role is "admin" {
  return role === "admin";
}

/**
 * Type guard to check if event is a blocker
 */
export function isBlockerEvent(event: EventDTO): event is EventDTO & {
  event_type: "blocker";
} {
  return event.event_type === "blocker";
}

/**
 * Type guard to check if event is synced from external calendar
 */
export function isSyncedEvent(event: EventDTO): boolean {
  return event.is_synced;
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safe parse helper that returns a Result-like object
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return { success: false as const, error: result.error };
}

/**
 * Format Zod errors into ValidationErrorDTO array
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorDTO[] {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

// ============================================================================
// Query Parameter Schemas
// ============================================================================

/**
 * Query parameters for listing events
 */
export const listEventsQuerySchema = z
  .object({
    family_id: uuidSchema,
    start_date: dateSchema,
    end_date: dateSchema,
    participant_ids: z.string().optional(),
    event_type: eventTypeSchema.optional(),
    include_synced: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((val) => {
        if (typeof val === "boolean") return val;
        if (typeof val === "string") return val === "true" || val === "1";
        return true;
      })
      .pipe(z.boolean())
      .default(true),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (typeof val === "number") return val;
        if (typeof val === "string") return parseInt(val || "100", 10);
        return 100;
      })
      .pipe(z.number().int().min(1).max(100))
      .default(100),
    offset: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (typeof val === "number") return val;
        if (typeof val === "string") return parseInt(val || "0", 10);
        return 0;
      })
      .pipe(z.number().int().nonnegative())
      .default(0),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "end_date must be after start_date",
      path: ["end_date"],
    }
  );

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

/**
 * Query parameters for getting a single event
 */
export const getEventQuerySchema = z.object({
  date: dateSchema.optional(),
});

export type GetEventQuery = z.infer<typeof getEventQuerySchema>;

/**
 * Query parameters for updating/deleting an event
 */
export const updateEventQuerySchema = z.object({
  scope: eventUpdateScopeSchema.optional().default("this"),
  date: dateSchema.optional(),
});

export type UpdateEventQuery = z.infer<typeof updateEventQuerySchema>;

/**
 * Path parameter schema for event ID
 */
export const eventIdPathSchema = z.object({
  id: uuidSchema,
});

export type EventIdPath = z.infer<typeof eventIdPathSchema>;

/**
 * Path parameter schema for family ID
 */
export const familyIdPathSchema = z.object({
  id: uuidSchema,
});

export type FamilyIdPath = z.infer<typeof familyIdPathSchema>;

/**
 * Path parameter schema for family ID (alternative param name)
 */
export const familyIdParamPathSchema = z.object({
  familyId: uuidSchema,
});

export type FamilyIdParamPath = z.infer<typeof familyIdParamPathSchema>;

/**
 * Path parameter schema for child ID
 */
export const childIdPathSchema = z.object({
  childId: uuidSchema,
});

export type ChildIdPath = z.infer<typeof childIdPathSchema>;

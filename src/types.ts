import { z } from "zod";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

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

export type EventType = Enums<"event_type_enum">;
export type FamilyRole = Enums<"family_role_enum">;
export type InvitationStatus = Enums<"invitation_status_enum">;
export type ActorType = Enums<"actor_type_enum">;

export const uuidSchema = z.string().uuid();

export const timestampSchema = z.string().datetime({ offset: true }).or(z.string().datetime());

export const dateSchema = z.string().date();

export const emailSchema = z.string().email();

export const eventTypeSchema = z.enum(["elastic", "blocker"]);

export const familyRoleSchema = z.enum(["admin", "member"]);

export const invitationStatusSchema = z.enum(["pending", "accepted", "expired"]);

export const actorTypeSchema = z.enum(["user", "system"]);

export const participantTypeSchema = z.enum(["user", "child"]);

export const calendarProviderSchema = z.enum(["google", "microsoft"]);

export type CalendarProvider = z.infer<typeof calendarProviderSchema>;

export const calendarSyncStatusSchema = z.enum(["active", "error"]);

export const eventUpdateScopeSchema = z.enum(["this", "future", "all"]);

export const recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly"]);




export const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  has_more: z.boolean(),
});

export type PaginationDTO = z.infer<typeof paginationSchema>;

export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ValidationErrorDTO = z.infer<typeof validationErrorSchema>;

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponseDTO = z.infer<typeof errorResponseSchema>;




export const userSchema = z.object({
  id: uuidSchema,
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  updated_at: timestampSchema.nullable(),
});

export type UserDTO = z.infer<typeof userSchema>;

export const userSummarySchema = z.object({
  id: uuidSchema,
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
});

export type UserSummaryDTO = z.infer<typeof userSummarySchema>;

export const userFamilyMembershipSchema = z.object({
  family_id: uuidSchema,
  family_name: z.string(),
  role: familyRoleSchema,
  joined_at: timestampSchema,
});

export type UserFamilyMembershipDTO = z.infer<typeof userFamilyMembershipSchema>;

export const userProfileSchema = userSchema.extend({
  families: z.array(userFamilyMembershipSchema),
});

export type UserProfileDTO = z.infer<typeof userProfileSchema>;

export const updateUserCommandSchema = z
  .object({
    full_name: z.string().max(100).optional(),
    avatar_url: z.string().url().optional(),
  })
  .strict();

export type UpdateUserCommand = z.infer<typeof updateUserCommandSchema>;

export const listUsersResponseSchema = z.object({
  users: z.array(userSummarySchema),
});

export type ListUsersResponseDTO = z.infer<typeof listUsersResponseSchema>;




export const familySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  created_at: timestampSchema,
});

export type FamilyDTO = z.infer<typeof familySchema>;

export const createFamilyCommandSchema = z
  .object({
    name: z.string().trim().min(1, "Family name is required").max(100, "Family name must be less than 100 characters"),
  })
  .strict();

export type CreateFamilyCommand = z.infer<typeof createFamilyCommandSchema>;

export const createFamilyResponseSchema = familySchema.extend({
  role: familyRoleSchema,
});

export type CreateFamilyResponseDTO = z.infer<typeof createFamilyResponseSchema>;

export const familyMemberSchema = z.object({
  user_id: uuidSchema,
  full_name: z.string().max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  role: familyRoleSchema,
  joined_at: timestampSchema,
});

export type FamilyMemberDTO = z.infer<typeof familyMemberSchema>;

export const listFamilyMembersResponseSchema = z.object({
  members: z.array(familyMemberSchema),
});

export type ListFamilyMembersResponseDTO = z.infer<typeof listFamilyMembersResponseSchema>;

export const childSchema = z.object({
  id: uuidSchema,
  family_id: uuidSchema,
  name: z.string().min(1).max(100),
  created_at: timestampSchema,
});

export type ChildDTO = z.infer<typeof childSchema>;

export const familyDetailsSchema = familySchema.extend({
  members: z.array(familyMemberSchema),
  children: z.array(childSchema),
});

export type FamilyDetailsDTO = z.infer<typeof familyDetailsSchema>;

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

export const updateFamilyResponseSchema = familySchema.extend({
  updated_at: timestampSchema,
});

export type UpdateFamilyResponseDTO = z.infer<typeof updateFamilyResponseSchema>;

export const updateMemberRoleCommandSchema = z
  .object({
    role: familyRoleSchema,
  })
  .strict();

export type UpdateMemberRoleCommand = z.infer<typeof updateMemberRoleCommandSchema>;

export const updateMemberRoleResponseSchema = z.object({
  family_id: uuidSchema,
  user_id: uuidSchema,
  role: familyRoleSchema,
  joined_at: timestampSchema,
});

export type UpdateMemberRoleResponseDTO = z.infer<typeof updateMemberRoleResponseSchema>;




export const createChildCommandSchema = z
  .object({
    name: z.string().trim().min(1, "Child name is required").max(100, "Child name must be less than 100 characters"),
  })
  .strict();

export type CreateChildCommand = z.infer<typeof createChildCommandSchema>;

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

export const updateChildResponseSchema = childSchema.extend({
  updated_at: timestampSchema,
});

export type UpdateChildResponseDTO = z.infer<typeof updateChildResponseSchema>;

export const listChildrenResponseSchema = z.object({
  children: z.array(childSchema),
});

export type ListChildrenResponseDTO = z.infer<typeof listChildrenResponseSchema>;




export const recurrencePatternSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().positive().default(1),
  end_date: dateSchema,
});

export type RecurrencePatternDTO = z.infer<typeof recurrencePatternSchema>;

export const eventParticipantSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: participantTypeSchema,
  avatar_url: z.string().url().nullable().optional(),
});

export type EventParticipantDTO = z.infer<typeof eventParticipantSchema>;

export const participantReferenceSchema = z.object({
  id: uuidSchema,
  type: participantTypeSchema,
});

export type ParticipantReferenceDTO = z.infer<typeof participantReferenceSchema>;

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

export const eventWithParticipantsSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
  has_conflict: z.boolean(),
});

export type EventWithParticipantsDTO = z.infer<typeof eventWithParticipantsSchema>;

export const eventExceptionSchema = z.object({
  id: uuidSchema,
  original_date: timestampSchema,
  new_start_time: timestampSchema.nullable(),
  new_end_time: timestampSchema.nullable(),
  is_cancelled: z.boolean(),
});

export type EventExceptionDTO = z.infer<typeof eventExceptionSchema>;

export const eventDetailsSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
  exceptions: z.array(eventExceptionSchema),
});

export type EventDetailsDTO = z.infer<typeof eventDetailsSchema>;

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

export const createEventResponseSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
});

export type CreateEventResponseDTO = z.infer<typeof createEventResponseSchema>;

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

export const updateEventResponseSchema = eventSchema.extend({
  participants: z.array(eventParticipantSchema),
  exception_created: z.boolean().optional(),
});

export type UpdateEventResponseDTO = z.infer<typeof updateEventResponseSchema>;

export const listEventsResponseSchema = z.object({
  events: z.array(eventWithParticipantsSchema),
  pagination: paginationSchema,
});

export type ListEventsResponseDTO = z.infer<typeof listEventsResponseSchema>;

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

export const conflictingEventSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  start_time: timestampSchema,
  end_time: timestampSchema,
  participants: z.array(eventParticipantSchema),
});

export type ConflictingEventDTO = z.infer<typeof conflictingEventSchema>;

export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(validationErrorSchema),
  conflicts: z.array(conflictingEventSchema),
});

export type ValidationResultDTO = z.infer<typeof validationResultSchema>;

export const eventConflictErrorSchema = errorResponseSchema.extend({
  conflicting_events: z.array(conflictingEventSchema),
});

export type EventConflictErrorDTO = z.infer<typeof eventConflictErrorSchema>;




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

export const listExternalCalendarsResponseSchema = z.object({
  calendars: z.array(externalCalendarSummarySchema),
});

export type ListExternalCalendarsResponseDTO = z.infer<typeof listExternalCalendarsResponseSchema>;

export const connectCalendarCommandSchema = z
  .object({
    provider: calendarProviderSchema,
    return_path: z.string().optional(),
  })
  .strict();

export type ConnectCalendarCommand = z.infer<typeof connectCalendarCommandSchema>;

export const calendarAuthResponseSchema = z.object({
  authorization_url: z.string().url(),
  state: z.string(),
});

export type CalendarAuthResponseDTO = z.infer<typeof calendarAuthResponseSchema>;

export const calendarSyncResultSchema = z.object({
  synced_at: timestampSchema,
  events_added: z.number().int().nonnegative(),
  events_updated: z.number().int().nonnegative(),
  events_removed: z.number().int().nonnegative(),
  status: z.enum(["success", "partial", "error"]),
  error_message: z.string().nullable().optional(),
});

export type CalendarSyncResultDTO = z.infer<typeof calendarSyncResultSchema>;

export const syncAllCalendarsResponseSchema = z.object({
  results: z.array(
    calendarSyncResultSchema.extend({
      calendar_id: uuidSchema,
    })
  ),
});

export type SyncAllCalendarsResponseDTO = z.infer<typeof syncAllCalendarsResponseSchema>;




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

export const listInvitationsResponseSchema = z.object({
  invitations: z.array(invitationWithInviterSchema),
});

export type ListInvitationsResponseDTO = z.infer<typeof listInvitationsResponseSchema>;

export const createInvitationCommandSchema = z
  .object({
    invitee_email: emailSchema,
  })
  .strict();

export type CreateInvitationCommand = z.infer<typeof createInvitationCommandSchema>;

export const createInvitationResponseSchema = invitationSchema.extend({
  invitation_url: z.string().url(),
});

export type CreateInvitationResponseDTO = z.infer<typeof createInvitationResponseSchema>;

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

export const acceptInvitationResponseSchema = z.object({
  family: z.object({
    id: uuidSchema,
    name: z.string(),
    role: familyRoleSchema,
  }),
});

export type AcceptInvitationResponseDTO = z.infer<typeof acceptInvitationResponseSchema>;




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

export const listLogsResponseSchema = z.object({
  logs: z.array(logSchema),
  pagination: paginationSchema,
});

export type ListLogsResponseDTO = z.infer<typeof listLogsResponseSchema>;




export function isUserParticipant(
  participant: EventParticipantDTO
): participant is EventParticipantDTO & { type: "user" } {
  return participant.type === "user";
}

export function isChildParticipant(
  participant: EventParticipantDTO
): participant is EventParticipantDTO & { type: "child" } {
  return participant.type === "child";
}

export function isRecurringEvent(event: EventDTO): event is EventDTO & {
  recurrence_pattern: RecurrencePatternDTO;
} {
  return event.recurrence_pattern !== null;
}

export function isPendingInvitation(invitation: InvitationDTO | InvitationWithInviterDTO): boolean {
  return invitation.status === "pending";
}

export function isAdmin(role: FamilyRole): role is "admin" {
  return role === "admin";
}

export function isBlockerEvent(event: EventDTO): event is EventDTO & {
  event_type: "blocker";
} {
  return event.event_type === "blocker";
}

export function isSyncedEvent(event: EventDTO): boolean {
  return event.is_synced;
}




export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return { success: false as const, error: result.error };
}

export function formatZodErrors(error: z.ZodError): ValidationErrorDTO[] {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}




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

export const getEventQuerySchema = z.object({
  date: dateSchema.optional(),
});

export type GetEventQuery = z.infer<typeof getEventQuerySchema>;

export const updateEventQuerySchema = z.object({
  scope: eventUpdateScopeSchema.optional().default("this"),
  date: dateSchema.optional(),
});

export type UpdateEventQuery = z.infer<typeof updateEventQuerySchema>;

export const eventIdPathSchema = z.object({
  id: uuidSchema,
});

export type EventIdPath = z.infer<typeof eventIdPathSchema>;

export const familyIdPathSchema = z.object({
  id: uuidSchema,
});

export type FamilyIdPath = z.infer<typeof familyIdPathSchema>;

export const familyIdParamPathSchema = z.object({
  familyId: uuidSchema,
});

export type FamilyIdParamPath = z.infer<typeof familyIdParamPathSchema>;

export const listLogsQuerySchema = z
  .object({
    family_id: uuidSchema.optional(),
    actor_id: uuidSchema.optional(),
    action: z.string().min(1).optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (typeof val === "number") return val;
        if (typeof val === "string") return parseInt(val || "50", 10);
        return 50;
      })
      .pipe(z.number().int().min(1).max(100))
      .default(50),
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
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "end_date must be greater than or equal to start_date",
      path: ["end_date"],
    }
  );

export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;

export const childIdPathSchema = z.object({
  childId: uuidSchema,
});

export type ChildIdPath = z.infer<typeof childIdPathSchema>;

export const calendarIdPathSchema = z.object({
  calendarId: uuidSchema,
});

export type CalendarIdPath = z.infer<typeof calendarIdPathSchema>;

export const listInvitationsQuerySchema = z.object({
  status: invitationStatusSchema.optional(),
});

export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;

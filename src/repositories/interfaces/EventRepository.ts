import type {
  EventEntity,
  EventInsert,
  EventUpdate,
  EventParticipantEntity,
  EventParticipantInsert,
  EventExceptionEntity,
  EventExceptionInsert,
  RecurrencePatternDTO,
  ParticipantReferenceDTO,
} from "@/types";

export interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  family_id: string;
  event_type: "elastic" | "blocker";
  is_all_day: boolean;
  created_at: string;
  recurrence_pattern?: RecurrencePatternDTO | null;
  is_synced?: boolean;
  external_calendar_id?: string | null;
  updated_at?: string | null;
}

export interface CreateEventDTO {
  title: string;
  start_time: string;
  end_time: string;
  family_id: string;
  event_type?: "elastic" | "blocker";
  is_all_day?: boolean;
  recurrence_pattern?: RecurrencePatternDTO | null;
  participants?: ParticipantReferenceDTO[];
}

export interface UpdateEventDTO {
  title?: string;
  start_time?: string;
  end_time?: string;
  event_type?: "elastic" | "blocker";
  is_all_day?: boolean;
  recurrence_pattern?: RecurrencePatternDTO | null;
  participants?: ParticipantReferenceDTO[];
  is_synced?: boolean;
  external_calendar_id?: string | null;
}

export interface EventWithParticipants extends Event {
  participants: Array<{
    id: string;
    name: string;
    type: "user" | "child";
    avatar_url?: string | null;
  }>;
  has_conflict?: boolean;
}

export interface EventDetails extends Event {
  participants: Array<{
    id: string;
    name: string;
    type: "user" | "child";
    avatar_url?: string | null;
  }>;
  exceptions: Array<{
    id: string;
    original_date: string;
    new_start_time: string | null;
    new_end_time: string | null;
    is_cancelled: boolean;
  }>;
}

export interface ConflictingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  participants: Array<{
    id: string;
    name: string;
    type: "user" | "child";
    avatar_url?: string | null;
  }>;
}

export interface FindEventsOptions {
  familyId: string;
  startDate: string;
  endDate: string;
  participantIds?: string[];
  eventType?: "elastic" | "blocker";
  includeSynced?: boolean;
  limit?: number;
  offset?: number;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByFamilyId(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]>;
  findByDateRange(options: FindEventsOptions): Promise<{ events: EventWithParticipants[]; total: number }>;
  create(data: CreateEventDTO): Promise<Event>;
  update(id: string, data: UpdateEventDTO): Promise<Event>;
  delete(id: string): Promise<void>;
  findByIdWithDetails(id: string, occurrenceDate?: string): Promise<EventDetails | null>;
  checkConflicts(
    familyId: string,
    startTime: string,
    endTime: string,
    participantIds: ParticipantReferenceDTO[],
    excludeEventId?: string
  ): Promise<ConflictingEvent[]>;
  addParticipants(eventId: string, participants: ParticipantReferenceDTO[]): Promise<void>;
  removeParticipants(eventId: string, participantIds: ParticipantReferenceDTO[]): Promise<void>;
  getParticipants(
    eventId: string
  ): Promise<Array<{ id: string; name: string; type: "user" | "child"; avatar_url?: string | null }>>;
  createException(
    eventId: string,
    exception: Omit<EventExceptionInsert, "event_id" | "id" | "created_at">
  ): Promise<EventExceptionEntity>;
  getExceptions(eventId: string): Promise<EventExceptionEntity[]>;
  deleteExceptions(eventId: string, originalDate?: string): Promise<void>;
}

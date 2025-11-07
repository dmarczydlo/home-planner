import type { Event } from "@/domain/entities/Event";
import type {
  CreateEventResponseDTO,
  UpdateEventResponseDTO,
  EventDetailsDTO,
  EventWithParticipantsDTO,
} from "@/types";
import type { EventDetails, EventWithParticipants } from "@/repositories/interfaces/EventRepository";

export class EventMapper {
  static toCreateResponseDTO(event: Event): CreateEventResponseDTO {
    return {
      id: event.id,
      family_id: event.familyId,
      title: event.title,
      start_time: event.startTime,
      end_time: event.endTime,
      is_all_day: event.isAllDay,
      event_type: event.eventType,
      recurrence_pattern: event.recurrencePattern,
      is_synced: event.isSynced,
      external_calendar_id: event.externalCalendarId,
      created_at: event.createdAt,
      updated_at: event.updatedAt,
      participants: event.participants.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        avatar_url: p.avatarUrl ?? null,
      })),
    };
  }

  static toUpdateResponseDTO(eventDetails: EventDetails, exceptionCreated: boolean): UpdateEventResponseDTO {
    return {
      id: eventDetails.id,
      family_id: eventDetails.family_id,
      title: eventDetails.title,
      start_time: eventDetails.start_time,
      end_time: eventDetails.end_time,
      is_all_day: eventDetails.is_all_day,
      event_type: eventDetails.event_type,
      recurrence_pattern: eventDetails.recurrence_pattern ?? null,
      is_synced: eventDetails.is_synced ?? false,
      external_calendar_id: eventDetails.external_calendar_id ?? null,
      created_at: eventDetails.created_at,
      updated_at: eventDetails.updated_at ?? null,
      participants: eventDetails.participants.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        avatar_url: p.avatar_url ?? null,
      })),
      exception_created: exceptionCreated,
    };
  }

  static toDetailsDTO(eventDetails: EventDetails): EventDetailsDTO {
    return {
      id: eventDetails.id,
      family_id: eventDetails.family_id,
      title: eventDetails.title,
      start_time: eventDetails.start_time,
      end_time: eventDetails.end_time,
      is_all_day: eventDetails.is_all_day,
      event_type: eventDetails.event_type,
      recurrence_pattern: eventDetails.recurrence_pattern ?? null,
      is_synced: eventDetails.is_synced ?? false,
      external_calendar_id: eventDetails.external_calendar_id ?? null,
      created_at: eventDetails.created_at,
      updated_at: eventDetails.updated_at ?? null,
      participants: eventDetails.participants,
      exceptions: eventDetails.exceptions.map((ex) => ({
        id: ex.id,
        original_date: ex.original_date,
        new_start_time: ex.new_start_time,
        new_end_time: ex.new_end_time,
        is_cancelled: ex.is_cancelled,
      })),
    };
  }

  static toListDTO(event: EventWithParticipants): EventWithParticipantsDTO {
    return {
      id: event.id,
      family_id: event.family_id,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      is_all_day: event.is_all_day,
      event_type: event.event_type,
      recurrence_pattern: event.recurrence_pattern ?? null,
      is_synced: event.is_synced ?? false,
      external_calendar_id: event.external_calendar_id ?? null,
      created_at: event.created_at,
      updated_at: event.updated_at ?? null,
      participants: event.participants,
      has_conflict: event.has_conflict ?? false,
    };
  }

  static fromRepositoryDetails(eventDetails: EventDetails): Event {
    return Event.create(
      eventDetails.id,
      eventDetails.family_id,
      eventDetails.title,
      eventDetails.start_time,
      eventDetails.end_time,
      eventDetails.event_type,
      eventDetails.is_all_day,
      eventDetails.created_at,
      eventDetails.recurrence_pattern ?? null,
      eventDetails.is_synced ?? false,
      eventDetails.external_calendar_id ?? null,
      eventDetails.updated_at ?? null,
      eventDetails.participants.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        avatarUrl: p.avatar_url ?? null,
      })),
      eventDetails.exceptions.map((e) => ({
        id: e.id,
        originalDate: e.original_date,
        newStartTime: e.new_start_time,
        newEndTime: e.new_end_time,
        isCancelled: e.is_cancelled,
      }))
    );
  }
}


import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { DomainError } from "@/domain/errors";
import type { Event } from "@/domain/entities/Event";
import type { UpdateEventCommand } from "@/types";
import type { EventRepository } from "@/repositories/interfaces/EventRepository";
import type { Family } from "@/domain/entities/Family";
import { ParticipantService } from "../participants/ParticipantService";

export class EventScopeHandler {
  static async handleUpdateScope(
    event: Event,
    command: UpdateEventCommand,
    scope: "this" | "future" | "all",
    occurrenceDate: string | undefined,
    family: Family,
    eventsRepo: EventRepository
  ): Promise<Result<{ exceptionCreated: boolean }, DomainError>> {
    let exceptionCreated = false;
    let updatedEvent = event;

    if (scope === "this" && event.recurrencePattern && occurrenceDate) {
      await eventsRepo.createException(event.id, {
        original_date: occurrenceDate,
        new_start_time: command.start_time ?? null,
        new_end_time: command.end_time ?? null,
        is_cancelled: false,
      });
      exceptionCreated = true;
    } else if (scope === "future" && event.recurrencePattern) {
      if (command.recurrence_pattern) {
        const updatedPattern = {
          ...event.recurrencePattern,
          end_date: occurrenceDate ?? event.startTime,
        };
        updatedEvent = updatedEvent.updateRecurrencePattern(updatedPattern);
      }
      if (command.title) updatedEvent = updatedEvent.updateTitle(command.title);
      if (command.start_time && command.end_time) {
        updatedEvent = updatedEvent.updateTime(command.start_time, command.end_time);
      }
      if (command.event_type) updatedEvent = updatedEvent.updateEventType(command.event_type);
      if (command.participants) {
        const newParticipants = ParticipantService.buildParticipants(family, command.participants);
        updatedEvent = updatedEvent.updateParticipants(newParticipants);
      }
      await eventsRepo.store(updatedEvent);
    } else {
      if (command.title) updatedEvent = updatedEvent.updateTitle(command.title);
      if (command.start_time && command.end_time) {
        updatedEvent = updatedEvent.updateTime(command.start_time, command.end_time);
      }
      if (command.event_type) updatedEvent = updatedEvent.updateEventType(command.event_type);
      if (command.recurrence_pattern !== undefined) {
        updatedEvent = updatedEvent.updateRecurrencePattern(command.recurrence_pattern);
      }
      if (command.participants) {
        const newParticipants = ParticipantService.buildParticipants(family, command.participants);
        updatedEvent = updatedEvent.updateParticipants(newParticipants);
      }
      await eventsRepo.store(updatedEvent);
      if (scope === "all" && event.recurrencePattern) {
        await eventsRepo.deleteExceptions(event.id);
      }
    }

    return ok({ exceptionCreated });
  }

  static async handleDeleteScope(
    event: Event,
    scope: "this" | "future" | "all",
    occurrenceDate: string | undefined,
    eventsRepo: EventRepository
  ): Promise<Result<void, DomainError>> {
    if (scope === "this" && event.recurrencePattern && occurrenceDate) {
      await eventsRepo.createException(event.id, {
        original_date: occurrenceDate,
        new_start_time: null,
        new_end_time: null,
        is_cancelled: true,
      });
    } else if (scope === "future" && event.recurrencePattern) {
      const updatedPattern = {
        ...event.recurrencePattern,
        end_date: occurrenceDate ?? event.startTime,
      };
      const updatedEvent = event.updateRecurrencePattern(updatedPattern);
      await eventsRepo.store(updatedEvent);
    } else {
      await eventsRepo.delete(event.id);
    }

    return ok(undefined);
  }
}

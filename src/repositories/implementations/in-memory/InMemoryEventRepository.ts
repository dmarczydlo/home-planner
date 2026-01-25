import type {
  EventRepository,
  Event,
  CreateEventDTO,
  UpdateEventDTO,
  EventWithParticipants,
  EventDetails,
  ConflictingEvent,
  FindEventsOptions,
} from "../../interfaces/EventRepository.ts";
import type { ParticipantReferenceDTO } from "@/types";

export class InMemoryEventRepository implements EventRepository {
  private events = new Map<string, Event>();
  private participants = new Map<string, ParticipantReferenceDTO[]>();
  private exceptions = new Map<
    string,
    {
      id: string;
      original_date: string;
      new_start_time: string | null;
      new_end_time: string | null;
      is_cancelled: boolean;
    }[]
  >();

  async findById(id: string): Promise<Event | null> {
    return this.events.get(id) ?? null;
  }

  async findByFamilyId(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]> {
    const events: Event[] = [];
    for (const event of this.events.values()) {
      if (event.family_id !== familyId) continue;

      if (startDate || endDate) {
        const eventStart = new Date(event.start_time);
        if (startDate && eventStart < startDate) continue;
        if (endDate && eventStart > endDate) continue;
      }

      events.push(event);
    }
    return events.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  async findByDateRange(options: FindEventsOptions): Promise<{ events: EventWithParticipants[]; total: number }> {
    const events = await this.findByFamilyId(options.familyId, new Date(options.startDate), new Date(options.endDate));

    const filtered = events.filter((e) => {
      if (options.eventType && e.event_type !== options.eventType) return false;
      if (options.includeSynced === false && e.is_synced) return false;
      return true;
    });

    const withParticipants = await Promise.all(
      filtered.map(async (e) => {
        const participants = await this.getParticipants(e.id);
        return {
          ...e,
          participants,
          has_conflict: false,
        };
      })
    );

    const total = withParticipants.length;
    const paginated = withParticipants.slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 100));

    return { events: paginated, total };
  }

  async create(data: CreateEventDTO): Promise<Event> {
    const event: Event = {
      id: crypto.randomUUID(),
      title: data.title,
      start_time: data.start_time,
      end_time: data.end_time,
      family_id: data.family_id,
      event_type: data.event_type ?? "elastic",
      is_all_day: data.is_all_day ?? false,
      created_at: new Date().toISOString(),
      recurrence_pattern: data.recurrence_pattern ?? null,
      is_synced: false,
      external_calendar_id: null,
      updated_at: null,
    };
    this.events.set(event.id, event);

    if (data.participants) {
      this.participants.set(event.id, data.participants);
    }

    return event;
  }

  async update(id: string, data: UpdateEventDTO): Promise<Event> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error(`Event with id ${id} not found`);
    }
    const updated: Event = {
      ...event,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.start_time !== undefined && { start_time: data.start_time }),
      ...(data.end_time !== undefined && { end_time: data.end_time }),
      ...(data.event_type !== undefined && { event_type: data.event_type }),
      ...(data.is_all_day !== undefined && { is_all_day: data.is_all_day }),
      ...(data.recurrence_pattern !== undefined && { recurrence_pattern: data.recurrence_pattern }),
      ...(data.is_synced !== undefined && { is_synced: data.is_synced }),
      ...(data.external_calendar_id !== undefined && { external_calendar_id: data.external_calendar_id }),
      updated_at: new Date().toISOString(),
    };
    this.events.set(id, updated);

    if (data.participants !== undefined) {
      this.participants.set(id, data.participants);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
    this.participants.delete(id);
    this.exceptions.delete(id);
  }

  async findByIdWithDetails(id: string): Promise<EventDetails | null> {
    const event = await this.findById(id);
    if (!event) return null;

    const participants = await this.getParticipants(id);
    const exceptions = await this.getExceptions(id);

    return {
      ...event,
      participants,
      exceptions: exceptions.map((ex) => ({
        id: ex.id,
        original_date: ex.original_date,
        new_start_time: ex.new_start_time,
        new_end_time: ex.new_end_time,
        is_cancelled: ex.is_cancelled,
      })),
    };
  }

  async checkConflicts(
    familyId: string,
    startTime: string,
    endTime: string,
    participantIds: ParticipantReferenceDTO[],
    excludeEventId?: string
  ): Promise<ConflictingEvent[]> {
    const events = await this.findByFamilyId(familyId);
    const blockerEvents = events.filter((e) => e.event_type === "blocker" && e.id !== excludeEventId);

    const conflicts: ConflictingEvent[] = [];

    for (const event of blockerEvents) {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const checkStart = new Date(startTime);
      const checkEnd = new Date(endTime);

      if (eventStart < checkEnd && eventEnd > checkStart) {
        const eventParticipants = await this.getParticipants(event.id);
        const hasOverlappingParticipant = eventParticipants.some((ep) =>
          participantIds.some((pid) => pid.id === ep.id && pid.type === ep.type)
        );

        if (hasOverlappingParticipant) {
          conflicts.push({
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            end_time: event.end_time,
            participants: eventParticipants,
          });
        }
      }
    }

    return conflicts;
  }

  async addParticipants(eventId: string, participants: ParticipantReferenceDTO[]): Promise<void> {
    const existing = this.participants.get(eventId) ?? [];
    const newParticipants = [...existing, ...participants];
    this.participants.set(eventId, newParticipants);
  }

  async removeParticipants(eventId: string, participantIds: ParticipantReferenceDTO[]): Promise<void> {
    const existing = this.participants.get(eventId) ?? [];
    const filtered = existing.filter((p) => !participantIds.some((pid) => pid.id === p.id && pid.type === p.type));
    this.participants.set(eventId, filtered);
  }

  async getParticipants(
    eventId: string
  ): Promise<{ id: string; name: string; type: "user" | "child"; avatar_url?: string | null }[]> {
    const refs = this.participants.get(eventId) ?? [];
    return refs.map((ref) => ({
      id: ref.id,
      name: `${ref.type} ${ref.id}`,
      type: ref.type,
      avatar_url: null,
    }));
  }

  async createException(
    eventId: string,
    exception: Omit<import("@/types").EventExceptionInsert, "event_id" | "id" | "created_at">
  ): Promise<import("@/types").EventExceptionEntity> {
    const existing = this.exceptions.get(eventId) ?? [];
    const newException = {
      id: crypto.randomUUID(),
      event_id: eventId,
      original_date: exception.original_date,
      new_start_time: exception.new_start_time ?? null,
      new_end_time: exception.new_end_time ?? null,
      is_cancelled: exception.is_cancelled ?? false,
      created_at: new Date().toISOString(),
    };
    existing.push(newException);
    this.exceptions.set(eventId, existing);
    return newException;
  }

  async getExceptions(eventId: string): Promise<import("@/types").EventExceptionEntity[]> {
    const exceptions = this.exceptions.get(eventId) ?? [];
    return exceptions.map((ex) => ({
      id: ex.id,
      event_id: eventId,
      original_date: ex.original_date,
      new_start_time: ex.new_start_time,
      new_end_time: ex.new_end_time,
      is_cancelled: ex.is_cancelled,
      created_at: new Date().toISOString(),
    }));
  }

  async deleteExceptions(eventId: string, originalDate?: string): Promise<void> {
    if (originalDate) {
      const existing = this.exceptions.get(eventId) ?? [];
      const filtered = existing.filter((ex) => ex.original_date !== originalDate);
      this.exceptions.set(eventId, filtered);
    } else {
      this.exceptions.delete(eventId);
    }
  }
}

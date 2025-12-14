import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
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
import type { ParticipantReferenceDTO, RecurrencePatternDTO } from "@/types";

export class SQLEventRepository implements EventRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Event | null> {
    const { data, error } = await this.supabase.from("events").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findByFamilyId(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]> {
    let query = this.supabase.from("events").select("*").eq("family_id", familyId);

    if (startDate) {
      query = query.gte("start_time", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("start_time", endDate.toISOString());
    }

    const { data, error } = await query.order("start_time", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.mapToDomain(row));
  }

  async findByDateRange(options: FindEventsOptions): Promise<{ events: EventWithParticipants[]; total: number }> {
    const {
      familyId,
      startDate,
      endDate,
      participantIds,
      eventType,
      includeSynced = true,
      limit = 100,
      offset = 0,
    } = options;

    let query = this.supabase
      .from("events")
      .select("*", { count: "exact" })
      .eq("family_id", familyId)
      .gte("start_time", startDate)
      .lte("start_time", endDate)
      .order("start_time", { ascending: true })
      .range(offset, offset + limit - 1);

    if (!includeSynced) {
      query = query.eq("is_synced", false);
    }

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data, error, count } = await query;

    if (error || !data) {
      return { events: [], total: 0 };
    }

    const allEvents: EventWithParticipants[] = [];

    for (const row of data) {
      const event = this.mapToDomain(row);
      const participants = await this.getParticipants(event.id);
      const hasConflict = event.event_type === "blocker" ? await this.hasConflict(event.id) : false;

      const eventWithParticipants: EventWithParticipants = {
        ...event,
        participants,
        has_conflict: hasConflict,
      };

      if (participantIds && participantIds.length > 0) {
        const eventParticipantIds = participants.map((p) => p.id);
        const hasMatchingParticipant = participantIds.some((id) => eventParticipantIds.includes(id));
        if (!hasMatchingParticipant) {
          continue;
        }
      }

      if (event.recurrence_pattern) {
        const expandedOccurrences = this.expandRecurringEvent(event, startDate, endDate);
        const exceptions = await this.getExceptions(event.id);
        
        for (const occurrence of expandedOccurrences) {
          const occurrenceDate = new Date(occurrence.start_time).toISOString().split("T")[0];
          const exception = exceptions.find(
            (ex) => new Date(ex.original_date).toISOString().split("T")[0] === occurrenceDate
          );

          if (exception && exception.is_cancelled) {
            continue;
          }

          allEvents.push({
            ...eventWithParticipants,
            start_time: exception?.new_start_time ?? occurrence.start_time,
            end_time: exception?.new_end_time ?? occurrence.end_time,
          });
        }
      } else {
        allEvents.push(eventWithParticipants);
      }
    }

    const flattenedEvents = allEvents;

    return { events: flattenedEvents, total: count ?? 0 };
  }

  async create(data: CreateEventDTO): Promise<Event> {
    const { data: result, error } = await this.supabase
      .from("events")
      .insert({
        title: data.title,
        start_time: data.start_time,
        end_time: data.end_time,
        family_id: data.family_id,
        event_type: data.event_type ?? "elastic",
        is_all_day: data.is_all_day ?? false,
        recurrence_pattern: data.recurrence_pattern ? JSON.stringify(data.recurrence_pattern) : null,
        is_synced: false,
      })
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create event: ${error?.message ?? "Unknown error"}`);
    }

    const event = this.mapToDomain(result);

    if (data.participants && data.participants.length > 0) {
      await this.addParticipants(event.id, data.participants);
    }

    return event;
  }

  async update(id: string, data: UpdateEventDTO): Promise<Event> {
    const updateData: Partial<Database["public"]["Tables"]["events"]["Update"]> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.event_type !== undefined) updateData.event_type = data.event_type;
    if (data.is_all_day !== undefined) updateData.is_all_day = data.is_all_day;
    if (data.recurrence_pattern !== undefined) {
      updateData.recurrence_pattern = data.recurrence_pattern ? JSON.stringify(data.recurrence_pattern) : null;
    }
    if (data.is_synced !== undefined) updateData.is_synced = data.is_synced;
    if (data.external_calendar_id !== undefined) updateData.external_calendar_id = data.external_calendar_id;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await this.supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to update event: ${error?.message ?? "Unknown error"}`);
    }

    if (data.participants !== undefined) {
      const existingParticipants = await this.getParticipants(id);
      const existingRefs: ParticipantReferenceDTO[] = existingParticipants.map((p) => ({
        id: p.id,
        type: p.type,
      }));

      const toRemove = existingRefs.filter(
        (ep) => !data.participants?.some((np) => np.id === ep.id && np.type === ep.type)
      );
      const toAdd = data.participants.filter(
        (np) => !existingRefs.some((ep) => ep.id === np.id && ep.type === np.type)
      );

      if (toRemove.length > 0) {
        await this.removeParticipants(id, toRemove);
      }
      if (toAdd.length > 0) {
        await this.addParticipants(id, toAdd);
      }
    }

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("events").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  async findByIdWithDetails(id: string, occurrenceDate?: string): Promise<EventDetails | null> {
    const event = await this.findById(id);
    if (!event) {
      return null;
    }

    const participants = await this.getParticipants(id);
    const exceptions = await this.getExceptions(id);

    let finalEvent: EventDetails = {
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

    if (occurrenceDate && event.recurrence_pattern) {
      const occurrence = this.getOccurrenceForDate(event, occurrenceDate, exceptions);
      if (occurrence) {
        finalEvent = {
          ...finalEvent,
          start_time: occurrence.start_time ?? finalEvent.start_time,
          end_time: occurrence.end_time ?? finalEvent.end_time,
        };
      }
    }

    return finalEvent;
  }

  async checkConflicts(
    familyId: string,
    startTime: string,
    endTime: string,
    participantIds: ParticipantReferenceDTO[],
    excludeEventId?: string
  ): Promise<ConflictingEvent[]> {
    if (participantIds.length === 0) {
      return [];
    }

    const participantUserIds = participantIds.filter((p) => p.type === "user").map((p) => p.id);
    const participantChildIds = participantIds.filter((p) => p.type === "child").map((p) => p.id);

    let query = this.supabase
      .from("events")
      .select("*")
      .eq("family_id", familyId)
      .eq("event_type", "blocker")
      .lt("start_time", endTime)
      .gt("end_time", startTime);

    if (excludeEventId) {
      query = query.neq("id", excludeEventId);
    }

    const { data: events, error } = await query;

    if (error || !events) {
      return [];
    }

    const conflictingEvents: ConflictingEvent[] = [];

    for (const event of events) {
      const eventParticipants = await this.getParticipants(event.id);
      const hasOverlappingParticipant = eventParticipants.some(
        (ep) =>
          (ep.type === "user" && participantUserIds.includes(ep.id)) ||
          (ep.type === "child" && participantChildIds.includes(ep.id))
      );

      if (hasOverlappingParticipant) {
        conflictingEvents.push({
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          participants: eventParticipants,
        });
      }
    }

    return conflictingEvents;
  }

  async addParticipants(eventId: string, participants: ParticipantReferenceDTO[]): Promise<void> {
    if (participants.length === 0) {
      return;
    }

    const inserts = participants.map((p) => ({
      event_id: eventId,
      user_id: p.type === "user" ? p.id : null,
      child_id: p.type === "child" ? p.id : null,
      participant_type: p.type,
    }));

    const { error } = await this.supabase.from("event_participants").insert(inserts);

    if (error) {
      throw new Error(`Failed to add participants: ${error.message}`);
    }
  }

  async removeParticipants(eventId: string, participantIds: ParticipantReferenceDTO[]): Promise<void> {
    if (participantIds.length === 0) {
      return;
    }

    for (const participant of participantIds) {
      const { error } = await this.supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("participant_type", participant.type)
        .eq(participant.type === "user" ? "user_id" : "child_id", participant.id);

      if (error) {
        throw new Error(`Failed to remove participant: ${error.message}`);
      }
    }
  }

  async getParticipants(eventId: string): Promise<Array<{ id: string; name: string; type: "user" | "child"; avatar_url?: string | null }>> {
    const { data: participants, error } = await this.supabase
      .from("event_participants")
      .select("participant_type, user_id, child_id")
      .eq("event_id", eventId);

    if (error || !participants) {
      return [];
    }

    const result: Array<{ id: string; name: string; type: "user" | "child"; avatar_url?: string | null }> = [];

    for (const p of participants) {
      if (p.participant_type === "user" && p.user_id) {
        const { data: user } = await this.supabase.from("users").select("full_name, avatar_url").eq("id", p.user_id).single();
        if (user) {
          result.push({
            id: p.user_id,
            name: user.full_name || "Unknown User",
            type: "user",
            avatar_url: user.avatar_url,
          });
        }
      } else if (p.participant_type === "child" && p.child_id) {
        const { data: child } = await this.supabase.from("children").select("name").eq("id", p.child_id).single();
        if (child) {
          result.push({
            id: p.child_id,
            name: child.name,
            type: "child",
            avatar_url: null,
          });
        }
      }
    }

    return result;
  }

  async createException(
    eventId: string,
    exception: Omit<import("@/types").EventExceptionInsert, "event_id" | "id" | "created_at">
  ): Promise<import("@/types").EventExceptionEntity> {
    const { data, error } = await this.supabase
      .from("event_exceptions")
      .insert({
        event_id: eventId,
        original_date: exception.original_date,
        new_start_time: exception.new_start_time ?? null,
        new_end_time: exception.new_end_time ?? null,
        is_cancelled: exception.is_cancelled ?? false,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create exception: ${error?.message ?? "Unknown error"}`);
    }

    return {
      id: data.id,
      event_id: data.event_id,
      original_date: data.original_date,
      new_start_time: data.new_start_time,
      new_end_time: data.new_end_time,
      is_cancelled: data.is_cancelled,
      created_at: data.created_at,
    };
  }

  async getExceptions(eventId: string): Promise<import("@/types").EventExceptionEntity[]> {
    const { data, error } = await this.supabase
      .from("event_exceptions")
      .select("*")
      .eq("event_id", eventId)
      .order("original_date", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      event_id: row.event_id,
      original_date: row.original_date,
      new_start_time: row.new_start_time,
      new_end_time: row.new_end_time,
      is_cancelled: row.is_cancelled,
      created_at: row.created_at,
    }));
  }

  async deleteExceptions(eventId: string, originalDate?: string): Promise<void> {
    let query = this.supabase.from("event_exceptions").delete().eq("event_id", eventId);

    if (originalDate) {
      query = query.eq("original_date", originalDate);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete exceptions: ${error.message}`);
    }
  }

  private mapToDomain(row: Database["public"]["Tables"]["events"]["Row"]): Event {
    let recurrencePattern: RecurrencePatternDTO | null = null;
    if (row.recurrence_pattern && typeof row.recurrence_pattern === "object") {
      try {
        const parsed = row.recurrence_pattern as { frequency: string; interval: number; end_date: string };
        recurrencePattern = {
          frequency: parsed.frequency as "daily" | "weekly" | "monthly",
          interval: parsed.interval ?? 1,
          end_date: parsed.end_date,
        };
      } catch {
        recurrencePattern = null;
      }
    }

    return {
      id: row.id,
      title: row.title,
      start_time: row.start_time,
      end_time: row.end_time,
      family_id: row.family_id,
      event_type: row.event_type,
      is_all_day: row.is_all_day,
      created_at: row.created_at,
      recurrence_pattern: recurrencePattern,
      is_synced: row.is_synced,
      external_calendar_id: row.external_calendar_id,
      updated_at: row.updated_at,
    };
  }

  private async hasConflict(eventId: string): Promise<boolean> {
    const event = await this.findById(eventId);
    if (!event || event.event_type !== "blocker") {
      return false;
    }

    const participants = await this.getParticipants(eventId);
    const participantRefs: ParticipantReferenceDTO[] = participants.map((p) => ({
      id: p.id,
      type: p.type,
    }));

    const conflicts = await this.checkConflicts(
      event.family_id,
      event.start_time,
      event.end_time,
      participantRefs,
      eventId
    );

    return conflicts.length > 0;
  }

  private expandRecurringEvent(event: Event, startDate: string, endDate: string): Array<{ start_time: string; end_time: string }> {
    if (!event.recurrence_pattern) {
      return [{ start_time: event.start_time, end_time: event.end_time }];
    }

    const pattern = event.recurrence_pattern;
    const occurrences: Array<{ start_time: string; end_time: string }> = [];
    const baseStart = new Date(event.start_time);
    const baseEnd = new Date(event.end_time);
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    const patternEnd = new Date(pattern.end_date);

    let currentDate = new Date(baseStart);
    const duration = baseEnd.getTime() - baseStart.getTime();

    while (currentDate <= patternEnd && currentDate <= rangeEnd) {
      if (currentDate >= rangeStart) {
        const occurrenceEnd = new Date(currentDate.getTime() + duration);
        occurrences.push({
          start_time: currentDate.toISOString(),
          end_time: occurrenceEnd.toISOString(),
        });
      }

      switch (pattern.frequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
      }
    }

    return occurrences;
  }

  private getOccurrenceForDate(
    event: Event,
    date: string,
    exceptions: import("@/types").EventExceptionEntity[]
  ): { start_time: string | null; end_time: string | null; is_cancelled: boolean } | null {
    if (!event.recurrence_pattern) {
      return null;
    }

    const targetDate = new Date(date);
    const baseStart = new Date(event.start_time);
    const baseEnd = new Date(event.end_time);
    const pattern = event.recurrence_pattern;
    const patternEnd = new Date(pattern.end_date);

    const exception = exceptions.find((ex) => {
      const exDate = new Date(ex.original_date);
      return exDate.toDateString() === targetDate.toDateString();
    });

    if (exception) {
      return {
        start_time: exception.new_start_time,
        end_time: exception.new_end_time,
        is_cancelled: exception.is_cancelled,
      };
    }

    let currentDate = new Date(baseStart);
    const duration = baseEnd.getTime() - baseStart.getTime();

    while (currentDate <= patternEnd) {
      if (currentDate.toDateString() === targetDate.toDateString()) {
        const occurrenceEnd = new Date(currentDate.getTime() + duration);
        return {
          start_time: currentDate.toISOString(),
          end_time: occurrenceEnd.toISOString(),
          is_cancelled: false,
        };
      }

      switch (pattern.frequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
      }
    }

    return null;
  }
}

import type { EventRepository, Event, CreateEventDTO, UpdateEventDTO } from "../../interfaces/EventRepository.ts";

export class InMemoryEventRepository implements EventRepository {
  private events: Map<string, Event> = new Map();

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
    };
    this.events.set(event.id, event);
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
    };
    this.events.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
  }
}

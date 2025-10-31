import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { EventRepository, Event, CreateEventDTO, UpdateEventDTO } from "../../interfaces/EventRepository.ts";

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
      })
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create event: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async update(id: string, data: UpdateEventDTO): Promise<Event> {
    const updateData: Partial<Database["public"]["Tables"]["events"]["Update"]> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.event_type !== undefined) updateData.event_type = data.event_type;
    if (data.is_all_day !== undefined) updateData.is_all_day = data.is_all_day;

    const { data: result, error } = await this.supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to update event: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("events").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  private mapToDomain(row: Database["public"]["Tables"]["events"]["Row"]): Event {
    return {
      id: row.id,
      title: row.title,
      start_time: row.start_time,
      end_time: row.end_time,
      family_id: row.family_id,
      event_type: row.event_type,
      is_all_day: row.is_all_day,
      created_at: row.created_at,
    };
  }
}

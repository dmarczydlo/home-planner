import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { ExternalCalendarRepository } from "../../interfaces/ExternalCalendarRepository.ts";
import type { ExternalCalendarEntity, ExternalCalendarInsert, ExternalCalendarUpdate } from "@/types";

export class SQLExternalCalendarRepository implements ExternalCalendarRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByUserId(userId: string): Promise<ExternalCalendarEntity[]> {
    const { data, error } = await this.supabase
      .from("external_calendars")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch external calendars: ${error.message}`);
    }

    return (data || []).map((row) => this.mapToEntity(row));
  }

  async findById(id: string): Promise<ExternalCalendarEntity | null> {
    const { data, error } = await this.supabase
      .from("external_calendars")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
    accountEmail: string
  ): Promise<ExternalCalendarEntity | null> {
    const { data, error } = await this.supabase
      .from("external_calendars")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("account_email", accountEmail)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async create(data: ExternalCalendarInsert): Promise<ExternalCalendarEntity> {
    const insertData: Database["public"]["Tables"]["external_calendars"]["Insert"] = {
      user_id: data.user_id,
      provider: data.provider,
      account_email: data.account_email,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at ?? null,
      last_synced_at: data.last_synced_at ?? null,
    };

    const { data: result, error } = await this.supabase
      .from("external_calendars")
      .insert(insertData)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create external calendar: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToEntity(result);
  }

  async update(id: string, data: ExternalCalendarUpdate): Promise<ExternalCalendarEntity> {
    const updateData: Partial<Database["public"]["Tables"]["external_calendars"]["Update"]> = {};

    if (data.user_id !== undefined) updateData.user_id = data.user_id;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.account_email !== undefined) updateData.account_email = data.account_email;
    if (data.access_token !== undefined) updateData.access_token = data.access_token;
    if (data.refresh_token !== undefined) updateData.refresh_token = data.refresh_token;
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at;
    if (data.last_synced_at !== undefined) updateData.last_synced_at = data.last_synced_at;

    const { data: result, error } = await this.supabase
      .from("external_calendars")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to update external calendar: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("external_calendars").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete external calendar: ${error.message}`);
    }
  }

  async updateLastSyncedAt(id: string, syncedAt: string): Promise<void> {
    const { error } = await this.supabase
      .from("external_calendars")
      .update({ last_synced_at: syncedAt })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update last synced at: ${error.message}`);
    }
  }

  async deleteEventsByCalendarId(calendarId: string): Promise<void> {
    const { error } = await this.supabase.from("events").delete().eq("external_calendar_id", calendarId);

    if (error) {
      throw new Error(`Failed to delete events for calendar: ${error.message}`);
    }
  }

  private mapToEntity(row: Database["public"]["Tables"]["external_calendars"]["Row"]): ExternalCalendarEntity {
    return {
      id: row.id,
      user_id: row.user_id,
      provider: row.provider,
      account_email: row.account_email,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      expires_at: row.expires_at,
      last_synced_at: row.last_synced_at,
      created_at: row.created_at,
    };
  }
}


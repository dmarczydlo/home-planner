import type { ExternalCalendarRepository } from "../../interfaces/ExternalCalendarRepository.ts";
import type { ExternalCalendarEntity, ExternalCalendarInsert, ExternalCalendarUpdate } from "@/types";

export class InMemoryExternalCalendarRepository implements ExternalCalendarRepository {
  private calendars = new Map<string, ExternalCalendarEntity>();

  async findByUserId(userId: string): Promise<ExternalCalendarEntity[]> {
    return Array.from(this.calendars.values()).filter((cal) => cal.user_id === userId);
  }

  async findById(id: string): Promise<ExternalCalendarEntity | null> {
    return this.calendars.get(id) || null;
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
    accountEmail: string
  ): Promise<ExternalCalendarEntity | null> {
    const calendars = Array.from(this.calendars.values());
    return (
      calendars.find(
        (cal) => cal.user_id === userId && cal.provider === provider && cal.account_email === accountEmail
      ) || null
    );
  }

  async create(data: ExternalCalendarInsert): Promise<ExternalCalendarEntity> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const calendar: ExternalCalendarEntity = {
      id,
      user_id: data.user_id,
      provider: data.provider,
      account_email: data.account_email,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at ?? null,
      last_synced_at: data.last_synced_at ?? null,
      created_at: data.created_at || now,
    };
    this.calendars.set(id, calendar);
    return calendar;
  }

  async update(id: string, data: ExternalCalendarUpdate): Promise<ExternalCalendarEntity> {
    const existing = this.calendars.get(id);
    if (!existing) {
      throw new Error(`External calendar with id ${id} not found`);
    }
    const updated: ExternalCalendarEntity = {
      ...existing,
      ...(data.user_id !== undefined && { user_id: data.user_id }),
      ...(data.provider !== undefined && { provider: data.provider }),
      ...(data.account_email !== undefined && { account_email: data.account_email }),
      ...(data.access_token !== undefined && { access_token: data.access_token }),
      ...(data.refresh_token !== undefined && { refresh_token: data.refresh_token }),
      ...(data.expires_at !== undefined && { expires_at: data.expires_at }),
      ...(data.last_synced_at !== undefined && { last_synced_at: data.last_synced_at }),
    };
    this.calendars.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.calendars.delete(id);
  }

  async updateLastSyncedAt(id: string, syncedAt: string): Promise<void> {
    const existing = this.calendars.get(id);
    if (!existing) {
      throw new Error(`External calendar with id ${id} not found`);
    }
    this.calendars.set(id, { ...existing, last_synced_at: syncedAt });
  }

  async deleteEventsByCalendarId(): Promise<void> {
  }
}

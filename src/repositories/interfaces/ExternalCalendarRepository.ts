import type { ExternalCalendarEntity, ExternalCalendarInsert, ExternalCalendarUpdate } from "@/types";

export interface ExternalCalendarRepository {
  findByUserId(userId: string): Promise<ExternalCalendarEntity[]>;

  findById(id: string): Promise<ExternalCalendarEntity | null>;

  findByUserIdAndProvider(
    userId: string,
    provider: string,
    accountEmail: string
  ): Promise<ExternalCalendarEntity | null>;

  create(data: ExternalCalendarInsert): Promise<ExternalCalendarEntity>;

  update(id: string, data: ExternalCalendarUpdate): Promise<ExternalCalendarEntity>;

  delete(id: string): Promise<void>;

  updateLastSyncedAt(id: string, syncedAt: string): Promise<void>;

  deleteEventsByCalendarId(calendarId: string): Promise<void>;
}

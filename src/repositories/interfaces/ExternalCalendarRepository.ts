import type { ExternalCalendarEntity, ExternalCalendarInsert, ExternalCalendarUpdate } from "@/types";

export interface ExternalCalendarRepository {
  /**
   * Find all calendars for a user
   */
  findByUserId(userId: string): Promise<ExternalCalendarEntity[]>;

  /**
   * Find calendar by ID
   */
  findById(id: string): Promise<ExternalCalendarEntity | null>;

  /**
   * Find calendar by user ID, provider, and account email
   */
  findByUserIdAndProvider(
    userId: string,
    provider: string,
    accountEmail: string
  ): Promise<ExternalCalendarEntity | null>;

  /**
   * Create new external calendar record
   */
  create(data: ExternalCalendarInsert): Promise<ExternalCalendarEntity>;

  /**
   * Update external calendar record
   */
  update(id: string, data: ExternalCalendarUpdate): Promise<ExternalCalendarEntity>;

  /**
   * Delete external calendar record
   */
  delete(id: string): Promise<void>;

  /**
   * Update last synced timestamp
   */
  updateLastSyncedAt(id: string, syncedAt: string): Promise<void>;

  /**
   * Delete all events associated with calendar
   */
  deleteEventsByCalendarId(calendarId: string): Promise<void>;
}


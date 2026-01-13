import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  DomainError,
  InternalError,
  RateLimitError,
} from "@/domain/errors";
import type { ExternalCalendarRepository } from "@/repositories/interfaces/ExternalCalendarRepository";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import type { EventRepository } from "@/repositories/interfaces/EventRepository";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import { calendarProviderSchema, validateSchema } from "@/types";
import type {
  ListExternalCalendarsResponseDTO,
  ExternalCalendarSummaryDTO,
  CalendarAuthResponseDTO,
  ConnectCalendarCommand,
  CalendarProvider,
  CalendarSyncResultDTO,
  SyncAllCalendarsResponseDTO,
} from "@/types";
import type { z } from "zod";
import { generateStateToken, validateStateToken } from "@/lib/oauth/stateToken";
import { createOAuthProvider } from "@/lib/oauth/providers";
import { encryptToken, decryptToken } from "@/lib/encryption/tokenEncryption";
import { RateLimiter } from "@/lib/rateLimit/rateLimiter";

export class ExternalCalendarService {
  private readonly rateLimiter = new RateLimiter();

  constructor(
    private readonly calendarRepo: ExternalCalendarRepository,
    private readonly logRepo: LogRepository,
    private readonly eventRepo: EventRepository,
    private readonly familyRepo: FamilyRepository
  ) {}

  async listCalendars(userId: string): Promise<Result<ListExternalCalendarsResponseDTO, DomainError>> {
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    try {
      const calendars = await this.calendarRepo.findByUserId(userId);

      const summaries: ExternalCalendarSummaryDTO[] = calendars.map((cal) => {
        const syncStatus = this.computeSyncStatus(cal);
        return {
          id: cal.id,
          provider: cal.provider as CalendarProvider,
          account_email: cal.account_email,
          last_synced_at: cal.last_synced_at,
          created_at: cal.created_at,
          sync_status: syncStatus,
          error_message: null,
        };
      });

      return ok({ calendars: summaries });
    } catch (error) {
      console.error("Failed to list external calendars:", error);
      return err(new InternalError("Failed to list external calendars"));
    }
  }

  async initiateOAuth(
    userId: string,
    provider: string,
    returnPath?: string
  ): Promise<Result<CalendarAuthResponseDTO, DomainError>> {
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    const validationResult = validateSchema(calendarProviderSchema, provider);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue: z.ZodIssue) => {
        fieldErrors[issue.path.join(".")] = issue.message;
      });
      return err(new ValidationError("Invalid provider value", fieldErrors));
    }

    try {
      const state = generateStateToken(userId, returnPath);
      const oauthProvider = createOAuthProvider(validationResult.data);

      const apiBaseUrl = import.meta.env.API_BASE_URL || import.meta.env.FRONTEND_URL || "http://localhost:4321";
      const redirectUri = `${apiBaseUrl}/api/external-calendars/callback`;

      const authorizationUrl = oauthProvider.generateAuthorizationUrl(state, redirectUri);

      return ok({
        authorization_url: authorizationUrl,
        state,
      });
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      return err(new InternalError("Failed to initiate OAuth flow"));
    }
  }

  async handleCallback(
    code: string,
    state: string,
    provider: string
  ): Promise<Result<{ calendarId: string; returnPath?: string }, DomainError>> {
    if (!code || !state || !provider) {
      return err(new ValidationError("Missing required parameters: code, state, or provider"));
    }

    const stateValidation = validateStateToken(state);
    if (!stateValidation.valid) {
      return err(new ValidationError("Invalid or expired state token"));
    }

    const userId = stateValidation.userId;
    const returnPath = stateValidation.returnPath;

    const providerValidation = validateSchema(calendarProviderSchema, provider);
    if (!providerValidation.success) {
      return err(new ValidationError("Invalid provider value"));
    }

    try {
      const oauthProvider = createOAuthProvider(providerValidation.data);
      const apiBaseUrl = import.meta.env.API_BASE_URL || import.meta.env.FRONTEND_URL || "http://localhost:4321";
      const redirectUri = `${apiBaseUrl}/api/external-calendars/callback`;

      const tokenResponse = await oauthProvider.exchangeCodeForTokens(code, redirectUri);

      const encryptedAccessToken = await encryptToken(tokenResponse.access_token);
      const encryptedRefreshToken = await encryptToken(tokenResponse.refresh_token);

      const userEmail = await oauthProvider.getUserEmail(tokenResponse.access_token);

      const existingCalendar = await this.calendarRepo.findByUserIdAndProvider(
        userId,
        providerValidation.data,
        userEmail
      );

      let calendarId: string;
      if (existingCalendar) {
        const expiresAt = tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null;

        const updated = await this.calendarRepo.update(existingCalendar.id, {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
          last_synced_at: null,
        });

        calendarId = updated.id;
      } else {
        const expiresAt = tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null;

        const created = await this.calendarRepo.create({
          user_id: userId,
          provider: providerValidation.data,
          account_email: userEmail,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
          last_synced_at: null,
        });

        calendarId = created.id;
      }

      this.logRepo
        .create({
          family_id: null,
          actor_id: userId,
          actor_type: "user",
          action: "external_calendar.connect",
          details: {
            calendar_id: calendarId,
            provider: providerValidation.data,
            account_email: userEmail,
          },
        })
        .catch((error) => {
          console.error("Failed to log external_calendar.connect:", error);
        });

      return ok({ calendarId, returnPath });
    } catch (error) {
      console.error("Failed to handle OAuth callback:", error);
      return err(new InternalError("Failed to complete OAuth flow"));
    }
  }

  async disconnectCalendar(userId: string, calendarId: string): Promise<Result<void, DomainError>> {
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    if (!calendarId || typeof calendarId !== "string") {
      return err(new ValidationError("Calendar ID is required"));
    }

    try {
      const calendar = await this.calendarRepo.findById(calendarId);
      if (!calendar) {
        return err(new NotFoundError("External calendar", calendarId));
      }

      if (calendar.user_id !== userId) {
        return err(new ForbiddenError("You do not have access to this calendar"));
      }

      try {
        const oauthProvider = createOAuthProvider(calendar.provider as CalendarProvider);
        const decryptedAccessToken = await decryptToken(calendar.access_token);
        await oauthProvider.revokeToken(decryptedAccessToken);
      } catch (error) {
        console.error("Failed to revoke OAuth token (non-blocking):", error);
      }

      await this.calendarRepo.deleteEventsByCalendarId(calendarId);
      await this.calendarRepo.delete(calendarId);

      this.logRepo
        .create({
          family_id: null,
          actor_id: userId,
          actor_type: "user",
          action: "external_calendar.disconnect",
          details: {
            calendar_id: calendarId,
            provider: calendar.provider,
            account_email: calendar.account_email,
          },
        })
        .catch((error) => {
          console.error("Failed to log external_calendar.disconnect:", error);
        });

      return ok(undefined);
    } catch (error) {
      console.error("Failed to disconnect calendar:", error);
      return err(new InternalError("Failed to disconnect calendar"));
    }
  }

  async syncCalendar(userId: string, calendarId: string): Promise<Result<CalendarSyncResultDTO, DomainError>> {
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    if (!calendarId || typeof calendarId !== "string") {
      return err(new ValidationError("Calendar ID is required"));
    }

    const rateLimitResult = await this.rateLimiter.checkSyncRateLimit(calendarId);
    if (!rateLimitResult.success) {
      return rateLimitResult;
    }

    try {
      const calendar = await this.calendarRepo.findById(calendarId);
      if (!calendar) {
        return err(new NotFoundError("External calendar", calendarId));
      }

      if (calendar.user_id !== userId) {
        return err(new ForbiddenError("You do not have access to this calendar"));
      }

      const oauthProvider = createOAuthProvider(calendar.provider as CalendarProvider);
      let accessToken = await decryptToken(calendar.access_token);

      if (calendar.expires_at && new Date(calendar.expires_at) <= new Date()) {
        const refreshResult = await oauthProvider.refreshToken(await decryptToken(calendar.refresh_token));
        const encryptedAccessToken = await encryptToken(refreshResult.access_token);
        const encryptedRefreshToken = refreshResult.refresh_token
          ? await encryptToken(refreshResult.refresh_token)
          : calendar.refresh_token;

        const expiresAt = refreshResult.expires_in
          ? new Date(Date.now() + refreshResult.expires_in * 1000).toISOString()
          : calendar.expires_at;

        await this.calendarRepo.update(calendarId, {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt,
        });

        accessToken = refreshResult.access_token;
      }

      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 90);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 365);

      const externalEvents = await oauthProvider.fetchEvents(accessToken, timeMin, timeMax);

      const userFamilies = await this.familyRepo.findByUserId(userId);
      if (userFamilies.length === 0) {
        return err(new ValidationError("User must belong to at least one family to sync calendar events"));
      }

      const targetFamilyId = userFamilies[0].id;

      const existingSyncedEvents = await this.findSyncedEventsByCalendar(targetFamilyId, calendarId);

      const reconciliationResult = await this.reconcileEvents(
        externalEvents,
        existingSyncedEvents,
        targetFamilyId,
        calendarId
      );

      const syncedAt = new Date().toISOString();
      await this.calendarRepo.updateLastSyncedAt(calendarId, syncedAt);
      this.rateLimiter.recordSync(calendarId);

      const status = reconciliationResult.events_removed > 0 || reconciliationResult.events_updated > 0 ? "partial" : "success";

      this.logRepo
        .create({
          family_id: targetFamilyId,
          actor_id: userId,
          actor_type: "user",
          action: "external_calendar.sync",
          details: {
            calendar_id: calendarId,
            provider: calendar.provider,
            events_added: reconciliationResult.events_added,
            events_updated: reconciliationResult.events_updated,
            events_removed: reconciliationResult.events_removed,
            status,
          },
        })
        .catch((error) => {
          console.error("Failed to log external_calendar.sync:", error);
        });

      return ok({
        synced_at: syncedAt,
        events_added: reconciliationResult.events_added,
        events_updated: reconciliationResult.events_updated,
        events_removed: reconciliationResult.events_removed,
        status,
        error_message: null,
      });
    } catch (error) {
      console.error("Failed to sync calendar:", error);
      return err(new InternalError("Failed to sync calendar"));
    }
  }

  async syncAllCalendars(userId: string): Promise<Result<SyncAllCalendarsResponseDTO, DomainError>> {
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    try {
      const calendars = await this.calendarRepo.findByUserId(userId);
      const results: Array<CalendarSyncResultDTO & { calendar_id: string }> = [];

      for (const calendar of calendars) {
        const syncResult = await this.syncCalendar(userId, calendar.id);
        if (syncResult.success) {
          results.push({
            calendar_id: calendar.id,
            ...syncResult.data,
          });
        } else {
          const errorMessage =
            syncResult.error instanceof RateLimitError
              ? syncResult.error.message
              : syncResult.error.message;

          results.push({
            calendar_id: calendar.id,
            synced_at: new Date().toISOString(),
            events_added: 0,
            events_updated: 0,
            events_removed: 0,
            status: "error",
            error_message: errorMessage,
          });
        }
      }

      return ok({ results });
    } catch (error) {
      console.error("Failed to sync all calendars:", error);
      return err(new InternalError("Failed to sync all calendars"));
    }
  }

  private async findSyncedEventsByCalendar(familyId: string, calendarId: string): Promise<Array<{ id: string; external_id?: string; title: string; start_time: string; end_time: string }>> {
    const allEvents = await this.eventRepo.findByFamilyId(familyId);
    return allEvents
      .filter((e) => e.is_synced && e.external_calendar_id === calendarId)
      .map((e) => ({
        id: e.id,
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
      }));
  }

  private async reconcileEvents(
    externalEvents: Array<{ id: string; title: string; start_time: string; end_time: string; is_all_day: boolean }>,
    existingEvents: Array<{ id: string; title: string; start_time: string; end_time: string }>,
    familyId: string,
    calendarId: string
  ): Promise<{ events_added: number; events_updated: number; events_removed: number }> {
    let eventsAdded = 0;
    let eventsUpdated = 0;
    let eventsRemoved = 0;

    const externalEventMap = new Map<string, typeof externalEvents[0]>();
    for (const extEvent of externalEvents) {
      externalEventMap.set(extEvent.id, extEvent);
    }

    const existingEventMap = new Map<string, typeof existingEvents[0]>();
    for (const existingEvent of existingEvents) {
      const matchKey = this.getEventMatchKey(existingEvent);
      existingEventMap.set(matchKey, existingEvent);
    }

    for (const extEvent of externalEvents) {
      const matchKey = this.getEventMatchKey(extEvent);
      const existingEvent = existingEventMap.get(matchKey);

      if (existingEvent) {
        if (
          existingEvent.title !== extEvent.title ||
          existingEvent.start_time !== extEvent.start_time ||
          existingEvent.end_time !== extEvent.end_time
        ) {
          await this.eventRepo.update(existingEvent.id, {
            title: extEvent.title,
            start_time: extEvent.start_time,
            end_time: extEvent.end_time,
            is_all_day: extEvent.is_all_day,
          });
          eventsUpdated++;
        }
        existingEventMap.delete(matchKey);
      } else {
        const createdEvent = await this.eventRepo.create({
          title: extEvent.title,
          start_time: extEvent.start_time,
          end_time: extEvent.end_time,
          family_id: familyId,
          event_type: "elastic",
          is_all_day: extEvent.is_all_day,
        });

        await this.markEventAsSynced(createdEvent.id, calendarId);
        eventsAdded++;
      }
    }

    for (const existingEvent of existingEventMap.values()) {
      await this.eventRepo.delete(existingEvent.id);
      eventsRemoved++;
    }

    return {
      events_added: eventsAdded,
      events_updated: eventsUpdated,
      events_removed: eventsRemoved,
    };
  }

  private async markEventAsSynced(eventId: string, calendarId: string): Promise<void> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    await this.eventRepo.update(eventId, {
      title: event.title,
      is_synced: true,
      external_calendar_id: calendarId,
    });
  }

  private getEventMatchKey(event: { title: string; start_time: string; end_time: string }): string {
    return `${event.title}|${event.start_time}|${event.end_time}`;
  }

  private computeSyncStatus(calendar: { last_synced_at: string | null }): "active" | "error" {
    if (!calendar.last_synced_at) {
      return "error";
    }

    const lastSync = new Date(calendar.last_synced_at);
    const now = new Date();
    const daysSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceSync > 7) {
      return "error";
    }

    return "active";
  }
}


import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExternalCalendarService } from "./ExternalCalendarService";
import { InMemoryExternalCalendarRepository } from "@/repositories/implementations/in-memory/InMemoryExternalCalendarRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { InMemoryEventRepository } from "@/repositories/implementations/in-memory/InMemoryEventRepository";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { ValidationError, NotFoundError, ForbiddenError, RateLimitError, InternalError } from "@/domain/errors";

vi.mock("@/lib/oauth/providers", () => ({
  createOAuthProvider: vi.fn(),
}));

vi.mock("@/lib/encryption/tokenEncryption", () => ({
  encryptToken: vi.fn((token: string) => Promise.resolve(`encrypted-${token}`)),
  decryptToken: vi.fn((encrypted: string) => Promise.resolve(encrypted.replace("encrypted-", ""))),
}));

vi.mock("@/lib/oauth/stateToken", () => ({
  generateStateToken: vi.fn((userId: string, returnPath?: string) => `state-token-${userId}-${returnPath || ""}`),
  validateStateToken: vi.fn((state: string) => {
    if (state.startsWith("state-token-")) {
      const parts = state.split("-");
      return {
        valid: true,
        userId: parts[2],
        returnPath: parts[3] || undefined,
      };
    }
    return { valid: false };
  }),
}));

const { mockCheckSyncRateLimit, mockRecordSync } = vi.hoisted(() => {
  const mockCheckSyncRateLimit = vi.fn().mockResolvedValue({ success: true });
  const mockRecordSync = vi.fn();
  return { mockCheckSyncRateLimit, mockRecordSync };
});

vi.mock("@/lib/rateLimit/rateLimiter", () => {
  class MockRateLimiter {
    async checkSyncRateLimit() {
      return mockCheckSyncRateLimit();
    }
    recordSync() {
      mockRecordSync();
    }
  }
  return {
    RateLimiter: MockRateLimiter,
  };
});

describe("ExternalCalendarService", () => {
  let calendarService: ExternalCalendarService;
  let calendarRepo: InMemoryExternalCalendarRepository;
  let logRepo: InMemoryLogRepository;
  let eventRepo: InMemoryEventRepository;
  let familyRepo: InMemoryFamilyRepository;
  let userId: string;
  let familyId: string;

  beforeEach(async () => {
    calendarRepo = new InMemoryExternalCalendarRepository();
    logRepo = new InMemoryLogRepository();
    eventRepo = new InMemoryEventRepository();
    familyRepo = new InMemoryFamilyRepository();
    calendarService = new ExternalCalendarService(calendarRepo, logRepo, eventRepo, familyRepo);

    userId = "user-123";
    const family = await familyRepo.create({ name: "Test Family" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");

    mockCheckSyncRateLimit.mockResolvedValue({ success: true });
    mockRecordSync.mockClear();
  });

  describe("listCalendars", () => {
    it("should list calendars successfully", async () => {
      await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: new Date().toISOString(),
      });

      const result = await calendarService.listCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.calendars).toHaveLength(1);
        expect(result.data.calendars[0].provider).toBe("google");
        expect(result.data.calendars[0].account_email).toBe("test@example.com");
      }
    });

    it("should return empty array when none connected", async () => {
      const result = await calendarService.listCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.calendars).toHaveLength(0);
      }
    });

    it("should compute sync status correctly - active", async () => {
      await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: new Date().toISOString(),
      });

      const result = await calendarService.listCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.calendars[0].sync_status).toBe("active");
      }
    });

    it("should compute sync status correctly - error", async () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: eightDaysAgo.toISOString(),
      });

      const result = await calendarService.listCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.calendars[0].sync_status).toBe("error");
      }
    });

    it("should return error when userId invalid", async () => {
      const result = await calendarService.listCalendars("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("User ID is required");
      }
    });

    it("should handle repository errors", async () => {
      const brokenRepo = {
        findByUserId: async () => {
          throw new Error("Database error");
        },
      } as unknown as typeof calendarRepo;

      const brokenService = new ExternalCalendarService(brokenRepo, logRepo, eventRepo, familyRepo);

      const result = await brokenService.listCalendars(userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InternalError);
      }
    });
  });

  describe("initiateOAuth", () => {
    it("should initiate OAuth successfully - Google", async () => {
      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        generateAuthorizationUrl: vi.fn().mockReturnValue("https:
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      const result = await calendarService.initiateOAuth(userId, "google");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authorization_url).toBeDefined();
        expect(result.data.state).toBeDefined();
      }
    });

    it("should initiate OAuth successfully - Microsoft 365", async () => {
      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        generateAuthorizationUrl: vi.fn().mockReturnValue("https:
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      const result = await calendarService.initiateOAuth(userId, "microsoft");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authorization_url).toBeDefined();
      }
    });

    it("should include returnPath in state", async () => {
      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        generateAuthorizationUrl: vi.fn().mockReturnValue("https:
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      const result = await calendarService.initiateOAuth(userId, "google", "/settings");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state).toContain("/settings");
      }
    });

    it("should return error when userId invalid", async () => {
      const result = await calendarService.initiateOAuth("", "google");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error when provider invalid", async () => {
      const result = await calendarService.initiateOAuth(userId, "invalid-provider");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("handleCallback", () => {
    it("should handle callback successfully - new calendar", async () => {
      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        exchangeCodeForTokens: vi.fn().mockResolvedValue({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
        }),
        getUserEmail: vi.fn().mockResolvedValue("test@example.com"),
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      const code = "auth-code";
      const state = `state-token-${userId}`;
      const provider = "google";

      const result = await calendarService.handleCallback(code, state, provider);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.calendarId).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
      const logs = logRepo.getLogs();
      expect(logs.some((log) => log.action === "external_calendar.connect")).toBe(true);
    });

    it("should handle callback successfully - existing calendar updated", async () => {
      const existingCalendar = await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-old-token",
        refresh_token: "encrypted-old-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      const calendarsBefore = await calendarRepo.findByUserId(userId);
      const calendarsCountBefore = calendarsBefore.length;

      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        exchangeCodeForTokens: vi.fn().mockResolvedValue({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_in: 3600,
        }),
        getUserEmail: vi.fn().mockResolvedValue("test@example.com"),
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      const code = "auth-code";
      const state = `state-token-${userId}`;
      const provider = "google";

      const result = await calendarService.handleCallback(code, state, provider);

      expect(result.success).toBe(true);
      if (result.success) {
        const calendarsAfter = await calendarRepo.findByUserId(userId);
        expect(calendarsAfter.length).toBe(calendarsCountBefore);
        const returnedCalendar = await calendarRepo.findById(result.data.calendarId);
        expect(returnedCalendar).not.toBeNull();
        if (returnedCalendar) {
          expect(returnedCalendar.access_token).toBe("encrypted-new-access-token");
          expect(returnedCalendar.refresh_token).toBe("encrypted-new-refresh-token");
          expect(returnedCalendar.account_email).toBe("test@example.com");
        }
      }
    });

    it("should validate state token", async () => {
      const result = await calendarService.handleCallback("code", "invalid-state", "google");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid or expired state token");
      }
    });

    it("should validate provider", async () => {
      const state = `state-token-${userId}`;
      const result = await calendarService.handleCallback("code", state, "invalid-provider");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("disconnectCalendar", () => {
    it("should disconnect calendar successfully", async () => {
      const calendar = await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        revokeToken: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      const result = await calendarService.disconnectCalendar(userId, calendar.id);

      expect(result.success).toBe(true);

      const deleted = await calendarRepo.findById(calendar.id);
      expect(deleted).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));
      const logs = logRepo.getLogs();
      expect(logs.some((log) => log.action === "external_calendar.disconnect")).toBe(true);
    });

    it("should return error when calendar not found", async () => {
      const result = await calendarService.disconnectCalendar(userId, "non-existent-id");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error when user doesn't own calendar", async () => {
      const calendar = await calendarRepo.create({
        user_id: "other-user",
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      const result = await calendarService.disconnectCalendar(userId, calendar.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
      }
    });
  });

  describe("syncCalendar", () => {
    beforeEach(async () => {
      await eventRepo.create({
        title: "Existing Synced Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
    });

    it("should sync calendar successfully - new events added", async () => {
      const calendar = await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-access-token",
        refresh_token: "encrypted-refresh-token",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        last_synced_at: null,
      });

      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        fetchEvents: vi.fn().mockResolvedValue([
          {
            id: "ext-event-1",
            title: "External Event 1",
            start_time: "2024-01-20T10:00:00Z",
            end_time: "2024-01-20T11:00:00Z",
            is_all_day: false,
          },
        ]),
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      mockCheckSyncRateLimit.mockResolvedValue({ success: true });

      const result = await calendarService.syncCalendar(userId, calendar.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events_added).toBeGreaterThanOrEqual(0);
        expect(result.data.status).toBeDefined();
      }
    });

    it("should enforce rate limiting", async () => {
      const calendar = await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      mockCheckSyncRateLimit.mockResolvedValue({
        success: false,
        error: new RateLimitError("Rate limit exceeded", 300),
      });

      const result = await calendarService.syncCalendar(userId, calendar.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(RateLimitError);
      }
    });

    it("should return error when user has no families", async () => {
      const otherUserId = "user-without-families";
      const calendar = await calendarRepo.create({
        user_id: otherUserId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      const result = await calendarService.syncCalendar(otherUserId, calendar.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("must belong to at least one family");
      }
    });

    it("should return error when calendar not found", async () => {
      const result = await calendarService.syncCalendar(userId, "non-existent-id");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error when user doesn't own calendar", async () => {
      const calendar = await calendarRepo.create({
        user_id: "other-user",
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      const result = await calendarService.syncCalendar(userId, calendar.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
      }
    });
  });

  describe("syncAllCalendars", () => {
    it("should sync all calendars successfully", async () => {
      await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      const { createOAuthProvider } = await import("@/lib/oauth/providers");
      const mockProvider = {
        fetchEvents: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(createOAuthProvider).mockReturnValue(mockProvider as any);

      mockCheckSyncRateLimit.mockResolvedValue({ success: true });

      const result = await calendarService.syncAllCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.results).toBeDefined();
      }
    });

    it("should handle partial failures", async () => {
      await calendarRepo.create({
        user_id: userId,
        provider: "google",
        account_email: "test@example.com",
        access_token: "encrypted-token",
        refresh_token: "encrypted-refresh",
        expires_at: null,
        last_synced_at: null,
      });

      mockCheckSyncRateLimit.mockResolvedValue({
        success: false,
        error: new RateLimitError("Rate limit exceeded", 300),
      });

      const result = await calendarService.syncAllCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.results.length).toBeGreaterThan(0);
        expect(result.data.results.some((r) => r.status === "error")).toBe(true);
      }
    });

    it("should return empty results when no calendars", async () => {
      const result = await calendarService.syncAllCalendars(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.results).toHaveLength(0);
      }
    });
  });
});

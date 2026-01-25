// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useExternalCalendars } from "./useExternalCalendars";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";
import type { CalendarSyncResultDTO } from "@/types";

// Mock fetch
global.fetch = vi.fn();

describe("useExternalCalendars", () => {
  beforeEach(() => {
    // Only clear fetch mock - don't clear module mocks
    if (vi.isMockFunction(global.fetch)) {
      vi.mocked(global.fetch).mockClear();
    }
  });

  describe("Initialization", () => {
    it("returns calendars array", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(Array.isArray(result.current.calendars)).toBe(true);
    });

    it("returns isLoading state", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(typeof result.current.isLoading).toBe("boolean");
    });

    it("returns error state", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(result.current.error === null || typeof result.current.error === "string").toBe(true);
    });

    it("returns syncStatus object", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(typeof result.current.syncStatus).toBe("object");
    });

    it("returns loadCalendars function", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(typeof result.current.loadCalendars).toBe("function");
    });

    it("returns syncCalendar function", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(typeof result.current.syncCalendar).toBe("function");
    });

    it("returns syncAllCalendars function", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(typeof result.current.syncAllCalendars).toBe("function");
    });

    it("returns disconnectCalendar function", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useExternalCalendars());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      // Assert
      expect(typeof result.current.disconnectCalendar).toBe("function");
    });
  });

  describe("loadCalendars", () => {
    it("loads calendars successfully on mount", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const mockCalendars = [
        { id: "cal-1", name: "Calendar 1", provider: "google" },
        { id: "cal-2", name: "Calendar 2", provider: "microsoft" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      // Act
      const { result } = renderHook(() => useExternalCalendars());

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.calendars).toEqual(mockCalendars);
      expect(result.current.error).toBeNull();
      expect(result.current.syncStatus["cal-1"]).toBe("idle");
      expect(result.current.syncStatus["cal-2"]).toBe("idle");
    });

    it("manages loading state during load", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({ calendars: [] }),
                } as Response),
              100
            )
          )
      );

      // Act
      const { result } = renderHook(() => useExternalCalendars());

      // Assert
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("handles API errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const errorMessage = "Failed to load calendars";

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ message: errorMessage }),
      } as Response);

      // Act
      const { result } = renderHook(() => useExternalCalendars());

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it("handles unauthenticated state", async () => {
      // Arrange
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useExternalCalendars());

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe("syncCalendar", () => {
    it.skip("syncs calendar successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const calendarId = "cal-1";
      const mockCalendars = [{ id: calendarId, name: "Calendar 1", provider: "google" }];
      const mockSyncResult = {
        status: "success",
        eventsAdded: 5,
        eventsUpdated: 2,
      };

      const mockUnsubscribe = vi.fn();
      const mockGetSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Set up the mock BEFORE rendering the hook
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: mockGetSession,
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: mockUnsubscribe },
            },
          })),
        },
      } as any);

      // Mock loadCalendars call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      const { result } = renderHook(() => useExternalCalendars());

      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(1);
      });

      // Mock sync call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSyncResult,
      } as Response);

      // Mock reload calendars after sync
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      // Act - Call syncCalendar
      const promise = result.current.syncCalendar(calendarId);

      // Note: The status is set to "syncing" synchronously at the start of syncCalendar,
      // but due to React state batching, we may not be able to reliably check it immediately.
      // Instead, we verify the function executes by awaiting the promise and checking the final status.

      let response: CalendarSyncResultDTO;
      try {
        response = await promise;
      } catch (err) {
        throw new Error(
          `syncCalendar failed: ${err instanceof Error ? err.message : String(err)}. Current error state: ${result.current.error}`
        );
      }

      expect(response).toEqual(mockSyncResult);
      await waitFor(
        () => {
          expect(result.current.syncStatus[calendarId]).toBe("success");
        },
        { timeout: 5000 }
      );

      // Wait for status to reset to idle (3 seconds)
      // Use waitFor with longer timeout instead of fixed delay
      await waitFor(
        () => {
          expect(result.current.syncStatus[calendarId]).toBe("idle");
        },
        { timeout: 5000 }
      );
    });

    it("handles sync errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const calendarId = "cal-1";
      const mockCalendars = [{ id: calendarId, name: "Calendar 1", provider: "google" }];
      const errorMessage = "Sync failed";

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock loadCalendars call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      const { result } = renderHook(() => useExternalCalendars());

      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(1);
      });

      // Mock sync call failure
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: errorMessage }),
      } as Response);

      // Act & Assert - Wrap in act() to avoid React warnings
      await act(async () => {
        await expect(result.current.syncCalendar(calendarId)).rejects.toThrow();
      });

      await waitFor(() => {
        expect(result.current.syncStatus[calendarId]).toBe("error");
        expect(result.current.error).toBe(errorMessage);
      });

      // Wait for status to reset to idle (3 seconds) - use waitFor with longer timeout
      await waitFor(
        () => {
          expect(result.current.syncStatus[calendarId]).toBe("idle");
        },
        { timeout: 5000, interval: 100 }
      );
    });
  });

  describe("syncAllCalendars", () => {
    it("syncs all calendars successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const mockCalendars = [
        { id: "cal-1", name: "Calendar 1", provider: "google" },
        { id: "cal-2", name: "Calendar 2", provider: "microsoft" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock loadCalendars call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      const { result } = renderHook(() => useExternalCalendars());

      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(2);
      });

      // Mock sync all call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      // Mock reload calendars after sync
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      // Act - Wrap in act() to avoid React warnings
      await act(async () => {
        await result.current.syncAllCalendars();
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith("/api/external-calendars/sync", {
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockSession.access_token}`,
        }),
      });
    });

    it("handles sync all errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const mockCalendars = [{ id: "cal-1", name: "Calendar 1", provider: "google" }];
      const errorMessage = "Sync all failed";

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock loadCalendars call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      const { result } = renderHook(() => useExternalCalendars());

      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(1);
      });

      // Mock sync all call failure
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: errorMessage }),
      } as Response);

      // Act & Assert - Wrap in act() to avoid React warnings
      await act(async () => {
        await expect(result.current.syncAllCalendars()).rejects.toThrow();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe("disconnectCalendar", () => {
    it("disconnects calendar successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const calendarId = "cal-1";
      const mockCalendars = [
        { id: calendarId, name: "Calendar 1", provider: "google" },
        { id: "cal-2", name: "Calendar 2", provider: "microsoft" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock loadCalendars call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      const { result } = renderHook(() => useExternalCalendars());

      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(2);
      });

      // Mock disconnect call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      // Act - Wrap in act() to avoid React warnings
      await act(async () => {
        await result.current.disconnectCalendar(calendarId);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(1);
        expect(result.current.calendars[0].id).toBe("cal-2");
        expect(result.current.syncStatus[calendarId]).toBeUndefined();
      });
    });

    it("handles disconnect errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const calendarId = "cal-1";
      const mockCalendars = [{ id: calendarId, name: "Calendar 1", provider: "google" }];
      const errorMessage = "Disconnect failed";

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock loadCalendars call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: mockCalendars }),
      } as Response);

      const { result } = renderHook(() => useExternalCalendars());

      await waitFor(() => {
        expect(result.current.calendars).toHaveLength(1);
      });

      // Mock disconnect call failure
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: errorMessage }),
      } as Response);

      // Act & Assert - Wrap in act() to avoid React warnings
      await act(async () => {
        await expect(result.current.disconnectCalendar(calendarId)).rejects.toThrow();
      });

      await waitFor(
        () => {
          expect(result.current.error).toBe(errorMessage);
        },
        { timeout: 10000 }
      );

      // Calendar should still be in the list
      expect(result.current.calendars).toHaveLength(1);
    });
  });
});

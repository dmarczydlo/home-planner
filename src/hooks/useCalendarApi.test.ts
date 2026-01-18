// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useCalendarApi } from "./useCalendarApi";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";

// Mock fetch
global.fetch = vi.fn();

describe("useCalendarApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("returns connectCalendar function", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarApi());

      // Assert
      expect(typeof result.current.connectCalendar).toBe("function");
    });

    it("returns listCalendars function", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarApi());

      // Assert
      expect(typeof result.current.listCalendars).toBe("function");
    });

    it("returns isConnecting state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarApi());

      // Assert
      expect(result.current.isConnecting).toBe(false);
    });

    it("returns error state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarApi());

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe("connectCalendar", () => {
    it("connects calendar successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const mockResponse = {
        auth_url: "https://example.com/auth",
        calendar: {
          id: "cal-123",
          name: "Test Calendar",
        },
      };

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
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useCalendarApi());

      // Act
      const command = { provider: "google" as const };
      let promise: Promise<any>;
      
      await act(async () => {
        promise = result.current.connectCalendar(command);
      });

      // Assert - State should be updating, but might complete too fast
      // Check that the function was called and promise exists
      expect(promise!).toBeDefined();
      expect(result.current.error).toBeNull();

      const response = await promise;

      await waitFor(() => {
        expect(result.current.isConnecting).toBe(false);
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith("/api/external-calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockSession.access_token}`,
        },
        body: JSON.stringify(command),
      });
    });

    it("manages loading state during connection", async () => {
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
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: async () => ({ auth_url: "https://example.com/auth" }),
        } as Response), 100))
      );

      const { result } = renderHook(() => useCalendarApi());

      // Act
      const command = { provider: "google" as const };
      const promise = result.current.connectCalendar(command);

      // Assert - State updates are async
      await waitFor(() => {
        expect(result.current.isConnecting).toBe(true);
      });

      await promise;

      await waitFor(() => {
        expect(result.current.isConnecting).toBe(false);
      });
    });

    it("handles API errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const errorMessage = "Calendar connection failed";

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
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ message: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useCalendarApi());

      // Act & Assert
      const command = { provider: "google" as const };
      await expect(result.current.connectCalendar(command)).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isConnecting).toBe(false);
      });
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

      const { result } = renderHook(() => useCalendarApi());

      // Act & Assert
      const command = { provider: "google" as const };
      await expect(result.current.connectCalendar(command)).rejects.toThrow("Not authenticated");

      await waitFor(() => {
        expect(result.current.error).toBe("Not authenticated");
        expect(result.current.isConnecting).toBe(false);
      });
    });
  });

  describe("listCalendars", () => {
    it("lists calendars successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const mockCalendars = [
        { id: "cal-1", name: "Calendar 1" },
        { id: "cal-2", name: "Calendar 2" },
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

      const { result } = renderHook(() => useCalendarApi());

      // Act
      const promise = result.current.listCalendars();

      // Assert
      expect(result.current.error).toBeNull();

      const calendars = await promise;

      expect(calendars).toEqual(mockCalendars);
      expect(global.fetch).toHaveBeenCalledWith("/api/external-calendars", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockSession.access_token}`,
        },
      });
    });

    it("handles API errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const errorMessage = "Failed to list calendars";

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

      const { result } = renderHook(() => useCalendarApi());

      // Act & Assert
      await expect(result.current.listCalendars()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
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

      const { result } = renderHook(() => useCalendarApi());

      // Act & Assert
      await expect(result.current.listCalendars()).rejects.toThrow("Not authenticated");

      await waitFor(() => {
        expect(result.current.error).toBe("Not authenticated");
      });
    });

    it("clears error on successful list", async () => {
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

      // First call fails
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Error" }),
      } as Response);

      const { result } = renderHook(() => useCalendarApi());

      // Act - First attempt fails
      await expect(result.current.listCalendars()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe("Error");
      });

      // Second call succeeds
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ calendars: [] }),
      } as Response);

      // Act - Second attempt
      await result.current.listCalendars();

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});

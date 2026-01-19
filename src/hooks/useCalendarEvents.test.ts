// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { type ReactNode } from "react";
import { renderHook, waitFor } from "@/test/utils/render";
import { useCalendarEvents } from "./useCalendarEvents";
import { CalendarProvider, useCalendar } from "@/contexts/CalendarContext";
import { createMockEvent } from "@/test/utils/mock-data";

// Mock fetch
global.fetch = vi.fn();

describe("useCalendarEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("returns events array", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarEvents("test-family-123"), {
        wrapper: CalendarProvider,
      });

      // Assert
      expect(Array.isArray(result.current.events)).toBe(true);
    });

    it("returns isLoading state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarEvents("test-family-123"), {
        wrapper: CalendarProvider,
      });

      // Assert
      expect(typeof result.current.isLoading).toBe("boolean");
    });

    it("returns error state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarEvents("test-family-123"), {
        wrapper: CalendarProvider,
      });

      // Assert
      expect(result.current.error).toBeNull();
    });

    it("returns refetch function", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarEvents("test-family-123"), {
        wrapper: CalendarProvider,
      });

      // Assert
      expect(typeof result.current.refetch).toBe("function");
    });
  });

  describe("Event Loading", () => {
    it("loads events on mount", async () => {
      // Arrange
      const familyId = "test-family-123";
      const mockEvents = [
        createMockEvent({ id: "event-1", family_id: familyId }),
        createMockEvent({ id: "event-2", family_id: familyId }),
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: mockEvents }),
      } as Response);

      // Act
      const { result } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: CalendarProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toEqual(mockEvents);
      expect(result.current.error).toBeNull();
    });

    it("manages loading state during fetch", async () => {
      // Arrange
      const familyId = "test-family-123";

      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: async () => ({ events: [] }),
        } as Response), 100))
      );

      // Act
      const { result } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: CalendarProvider,
      });

      // Assert
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("handles API errors", async () => {
      // Arrange
      const familyId = "test-family-123";

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      // Act
      const { result } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: CalendarProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain("Failed to fetch events");
    });

    it("does not load when familyId is empty", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useCalendarEvents(""), {
        wrapper: CalendarProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.events).toEqual([]);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("refetch", () => {
    it("refetches events successfully", async () => {
      // Arrange
      const familyId = "test-family-123";
      const initialEvents = [createMockEvent({ id: "event-1", family_id: familyId })];
      const updatedEvents = [
        createMockEvent({ id: "event-1", family_id: familyId }),
        createMockEvent({ id: "event-2", family_id: familyId }),
      ];

      // Mock initial load
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ events: initialEvents }),
      } as Response);

      const { result } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: CalendarProvider,
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      // Mock refetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ events: updatedEvents }),
      } as Response);

      // Act
      await result.current.refetch();

      // Assert
      await waitFor(() => {
        expect(result.current.events).toHaveLength(2);
      });
    });

    it("handles refetch errors", async () => {
      // Arrange
      const familyId = "test-family-123";
      const initialEvents = [createMockEvent({ id: "event-1", family_id: familyId })];

      // Mock initial load
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ events: initialEvents }),
      } as Response);

      const { result } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: CalendarProvider,
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      // Mock refetch error
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      // Act
      await result.current.refetch();

      // Assert
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe("Filtering", () => {
    it("includes participantIds in query when filters are set", async () => {
      // Arrange
      const familyId = "test-family-123";
      const participantIds = ["user-1", "user-2"];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Create a wrapper component that can set filters
      const FilterWrapper = ({ children, participantIds }: { children: ReactNode; participantIds: string[] }) => {
        const { setFilters } = useCalendar();
        
        React.useEffect(() => {
          setFilters({ participantIds });
        }, [setFilters, participantIds]);

        return React.createElement(React.Fragment, null, children);
      };

      // Act
      const { result } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: ({ children }: { children: ReactNode }) => {
          return React.createElement(
            CalendarProvider,
            null,
            React.createElement(FilterWrapper, { participantIds, children })
          );
        },
      });

      // Wait for the hook to load events with filters
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert - Verify fetch was called with participant_ids in query string
      expect(vi.mocked(global.fetch)).toHaveBeenCalled();
      const fetchCalls = vi.mocked(global.fetch).mock.calls;
      const lastCall = fetchCalls[fetchCalls.length - 1];
      const url = lastCall[0] as string;
      
      expect(url).toContain("participant_ids");
      expect(url).toContain("user-1");
      expect(url).toContain("user-2");
      expect(result.current.events).toEqual([]);
    });
  });

  describe("Abort Signal", () => {
    it("aborts fetch on unmount", async () => {
      // Arrange
      const familyId = "test-family-123";
      const abortSpy = vi.fn();

      vi.mocked(global.fetch).mockImplementation((url, options) => {
        if (options?.signal) {
          options.signal.addEventListener("abort", abortSpy);
        }
        return new Promise(() => {}); // Never resolves
      });

      // Act
      const { unmount } = renderHook(() => useCalendarEvents(familyId), {
        wrapper: CalendarProvider,
      });

      unmount();

      // Assert
      await waitFor(() => {
        expect(abortSpy).toHaveBeenCalled();
      });
    });
  });
});

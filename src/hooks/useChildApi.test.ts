// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useChildApi } from "./useChildApi";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";
import { createMockChild } from "@/test/utils/mock-data";

// Mock fetch
global.fetch = vi.fn();

describe("useChildApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("returns createChild function", () => {
      // Arrange & Act
      const { result } = renderHook(() => useChildApi());

      // Assert
      expect(typeof result.current.createChild).toBe("function");
    });

    it("returns isCreating state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useChildApi());

      // Assert
      expect(result.current.isCreating).toBe(false);
    });

    it("returns error state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useChildApi());

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe("createChild", () => {
    it("creates child successfully", async () => {
      // Arrange
      const mockChild = createMockChild();
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";

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
        json: async () => mockChild,
      } as Response);

      const { result } = renderHook(() => useChildApi());

      // Act
      const command = { name: "Test Child" };
      let promise: Promise<any>;
      
      await act(async () => {
        promise = result.current.createChild(familyId, command);
      });

      // Assert - State should be updating, but might complete too fast
      // Check that the function was called and promise exists
      expect(promise!).toBeDefined();
      expect(result.current.error).toBeNull();

      const response = await promise;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(response).toEqual(mockChild);
      expect(global.fetch).toHaveBeenCalledWith(`/api/families/${familyId}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockSession.access_token}`,
        },
        body: JSON.stringify(command),
      });
    });

    it("manages loading state during creation", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";

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
          json: async () => createMockChild(),
        } as Response), 100))
      );

      const { result } = renderHook(() => useChildApi());

      // Act
      const command = { name: "Test Child" };
      const promise = result.current.createChild(familyId, command);

      // Assert
      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      await promise;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it("handles API errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const errorMessage = "Child name already exists";

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

      const { result } = renderHook(() => useChildApi());

      // Act & Assert
      const command = { name: "Test Child" };
      await expect(result.current.createChild(familyId, command)).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isCreating).toBe(false);
      });
    });

    it("handles network errors", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useChildApi());

      // Act & Assert
      const command = { name: "Test Child" };
      await expect(result.current.createChild(familyId, command)).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isCreating).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });

    it("handles unauthenticated state", async () => {
      // Arrange
      const familyId = "test-family-123";

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
        },
      } as any);

      const { result } = renderHook(() => useChildApi());

      // Act & Assert
      const command = { name: "Test Child" };
      await expect(result.current.createChild(familyId, command)).rejects.toThrow("Not authenticated");

      await waitFor(() => {
        expect(result.current.error).toBe("Not authenticated");
        expect(result.current.isCreating).toBe(false);
      });
    });

    it("clears error on new creation attempt", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";

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
        status: 400,
        json: async () => ({ message: "Error" }),
      } as Response);

      const { result } = renderHook(() => useChildApi());

      // Act - First attempt fails
      const command = { name: "Test Child" };
      await expect(result.current.createChild(familyId, command)).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe("Error");
      });

      // Second call succeeds
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createMockChild(),
      } as Response);

      // Act - Second attempt
      await result.current.createChild(familyId, command);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});

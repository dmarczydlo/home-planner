// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useInvitationApi } from "./useInvitationApi";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";

// Mock fetch
global.fetch = vi.fn();

describe("useInvitationApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("returns createInvitation function", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useInvitationApi());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      }, { timeout: 1000 });

      // Assert
      expect(typeof result.current.createInvitation).toBe("function");
    });

    it("returns isCreating state", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useInvitationApi());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      }, { timeout: 1000 });

      // Assert
      expect(result.current.isCreating).toBe(false);
    });

    it("returns error state", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useInvitationApi());

      // Let mount effects settle to avoid React act() warnings
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      }, { timeout: 1000 });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe("createInvitation", () => {
    it("creates invitation successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const mockResponse = {
        invitation: {
          id: "inv-123",
          email: "test@example.com",
          status: "pending",
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

      const { result } = renderHook(() => useInvitationApi());

      // Act
      const command = { email: "test@example.com" };
      let promise: Promise<any>;
      
      await act(async () => {
        promise = result.current.createInvitation(familyId, command);
      });

      // Assert - State should be updating, but might complete too fast
      // Check that the function was called and promise exists
      expect(promise!).toBeDefined();
      expect(result.current.error).toBeNull();

      const response = await promise;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(`/api/families/${familyId}/invitations`, {
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

      let resolveFetch: ((value: any) => void) | null = null;
      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      );

      const { result } = renderHook(() => useInvitationApi());

      // Act - Start request but keep it pending so we can assert loading state
      const command = { email: "test@example.com" };
      let promise: Promise<any> | null = null;

      await act(async () => {
        promise = result.current.createInvitation(familyId, command);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      if (!resolveFetch) {
        throw new Error("Expected fetch promise resolver to be set");
      }

      (resolveFetch as (value: any) => void)({
        ok: true,
        status: 200,
        json: async () => ({ invitation: { id: "inv-123", email: "test@example.com" } }),
      } as Response);

      await act(async () => {
        await promise;
      });

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
      const errorMessage = "User already invited";

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

      const { result } = renderHook(() => useInvitationApi());

      // Act & Assert - Wrap in act() to avoid React warnings
      const command = { email: "test@example.com" };
      await act(async () => {
        await expect(result.current.createInvitation(familyId, command)).rejects.toThrow();
      });

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

      const { result } = renderHook(() => useInvitationApi());

      // Act & Assert - Wrap in act() to avoid React warnings
      const command = { email: "test@example.com" };
      await act(async () => {
        await expect(result.current.createInvitation(familyId, command)).rejects.toThrow();
      });

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

      const { result } = renderHook(() => useInvitationApi());

      // Act & Assert - Wrap in act() to avoid React warnings
      const command = { email: "test@example.com" };
      await act(async () => {
        await expect(result.current.createInvitation(familyId, command)).rejects.toThrow("Not authenticated");
      });

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

      const { result } = renderHook(() => useInvitationApi());

      // Act - First attempt fails - Wrap in act() to avoid React warnings
      const command = { email: "test@example.com" };
      await act(async () => {
        await expect(result.current.createInvitation(familyId, command)).rejects.toThrow();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Error");
      });

      // Second call succeeds
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitation: { id: "inv-123", email: "test@example.com" } }),
      } as Response);

      // Act - Second attempt - Wrap in act() to avoid React warnings
      await act(async () => {
        await result.current.createInvitation(familyId, command);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});

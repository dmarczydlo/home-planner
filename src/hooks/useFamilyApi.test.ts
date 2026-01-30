
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useFamilyApi } from "./useFamilyApi";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";
import { createMockFamily } from "@/test/utils/mock-data";

global.fetch = vi.fn();

describe("useFamilyApi", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Initialization", () => {
    it("returns createFamily function", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useFamilyApi());

      await waitFor(
        () => {
          expect(result.current.isCreating).toBe(false);
        },
        { timeout: 1000 }
      );

      // Assert
      expect(typeof result.current.createFamily).toBe("function");
    });

    it("returns isCreating state", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useFamilyApi());

      await waitFor(
        () => {
          expect(result.current.isCreating).toBe(false);
        },
        { timeout: 1000 }
      );

      // Assert
      expect(result.current.isCreating).toBe(false);
    });

    it("returns error state", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useFamilyApi());

      await waitFor(
        () => {
          expect(result.current.isCreating).toBe(false);
        },
        { timeout: 1000 }
      );

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe("createFamily", () => {
    it("creates family successfully", async () => {
      // Arrange
      const mockFamily = createMockFamily();
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

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockFamily,
      } as Response);

      const { result } = renderHook(() => useFamilyApi());

      // Act
      const command = { name: "Test Family" };
      let promise: Promise<any> | undefined;

      await act(async () => {
        promise = result.current.createFamily(command);
        await promise;
      });

      // Assert
      expect(promise).toBeDefined();
      expect(result.current.error).toBeNull();
      const response = await promise!;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(response).toEqual(mockFamily);
      expect(global.fetch).toHaveBeenCalledWith("/api/families", {
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

      const { result } = renderHook(() => useFamilyApi());

      // Act
      const command = { name: "Test Family" };
      let createPromise: Promise<unknown> | null = null;
      await act(async () => {
        createPromise = result.current.createFamily(command);
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
        json: async () => createMockFamily(),
      } as Response);

      await act(async () => {
        await createPromise;
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
      const errorMessage = "Family name already exists";

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

      const { result } = renderHook(() => useFamilyApi());

      // Act & Assert
      const command = { name: "Test Family" };
      await act(async () => {
        await expect(result.current.createFamily(command)).rejects.toThrow();
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

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useFamilyApi());

      // Act & Assert
      const command = { name: "Test Family" };
      await act(async () => {
        await expect(result.current.createFamily(command)).rejects.toThrow();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isCreating).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
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

      const { result } = renderHook(() => useFamilyApi());

      // Act & Assert
      const command = { name: "Test Family" };
      await act(async () => {
        await expect(result.current.createFamily(command)).rejects.toThrow("Not authenticated");
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

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Error" }),
      } as Response);

      const { result } = renderHook(() => useFamilyApi());

      // Act
      const command = { name: "Test Family" };
      await act(async () => {
        await expect(result.current.createFamily(command)).rejects.toThrow();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Error");
      });

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createMockFamily(),
      } as Response);

      // Act
      await act(async () => {
        await result.current.createFamily(command);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});

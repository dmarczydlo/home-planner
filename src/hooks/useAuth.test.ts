
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useAuth } from "./useAuth";
import { AuthProvider } from "@/contexts/AuthContext";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";
import { createMockUser } from "@/test/utils/mock-data";

global.fetch = vi.fn();

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("returns user object when authenticated", async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockSession = {
        session: {
          access_token: "mock-token",
          user: { id: mockUser.id },
        },
      };

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUser,
      } as Response);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("returns null when not authenticated", async () => {
      // Arrange
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("returns loading state initially", () => {
      // Arrange
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn(() => new Promise(() => {})),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("Authentication Functions", () => {
    it("returns signIn function", async () => {
      // Arrange
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.login).toBe("function");
    });

    it("returns signOut function", async () => {
      // Arrange
      const signOutSpy = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: signOutSpy,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.logout).toBe("function");

      await act(async () => {
        await result.current.logout();
      });
      expect(signOutSpy).toHaveBeenCalledTimes(1);
    });

    it("returns checkAuth function", async () => {
      // Arrange
      const getSessionSpy = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: getSessionSpy,
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.checkAuth).toBe("function");

      await act(async () => {
        await result.current.checkAuth();
      });
      expect(getSessionSpy).toHaveBeenCalled();
    });

    it("returns refreshUser function", async () => {
      // Arrange
      const mockUser = createMockUser();
      const getSessionSpy = vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: mockUser.id },
          },
        },
        error: null,
      });

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: getSessionSpy,
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUser,
      } as Response);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.refreshUser).toBe("function");

      await act(async () => {
        await result.current.refreshUser();
      });
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it("returns clearError function", async () => {
      // Arrange
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(typeof result.current.clearError).toBe("function");

      await act(async () => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("handles authentication errors", async () => {
      // Arrange
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockRejectedValue(new Error("Auth check failed")),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain("Failed to verify authentication");
      expect(result.current.error?.retryable).toBe(true);
    });

    it("handles logout errors", async () => {
      // Arrange
      const signOutSpy = vi.fn().mockRejectedValue(new Error("Logout failed"));
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: signOutSpy,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toContain("Failed to sign out");
        expect(result.current.error?.retryable).toBe(true);
      });
    });
  });

  describe("Context Provider Requirement", () => {
    it("throws error when used outside AuthProvider", () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within AuthProvider");
    });
  });
});

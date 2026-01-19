// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useFamilyData } from "./useFamilyData";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";
import { createMockFamily, createMockChild } from "@/test/utils/mock-data";

// Mock fetch
global.fetch = vi.fn();

describe("useFamilyData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("returns initial state with null familyId", () => {
      // Arrange & Act
      const { result } = renderHook(() => useFamilyData(null));

      // Assert
      expect(result.current.familyDetails).toBeNull();
      expect(result.current.members).toEqual([]);
      expect(result.current.children).toEqual([]);
      expect(result.current.invitations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("returns all required functions", () => {
      // Arrange & Act
      const { result } = renderHook(() => useFamilyData(null));

      // Assert
      expect(typeof result.current.refreshFamily).toBe("function");
      expect(typeof result.current.refreshMembers).toBe("function");
      expect(typeof result.current.refreshChildren).toBe("function");
      expect(typeof result.current.refreshInvitations).toBe("function");
      expect(typeof result.current.removeMember).toBe("function");
      expect(typeof result.current.removeChild).toBe("function");
      expect(typeof result.current.cancelInvitation).toBe("function");
      expect(typeof result.current.updateMemberRole).toBe("function");
    });
  });

  describe("refreshFamily", () => {
    it("loads family data on mount when familyId provided", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const mockFamily = {
        id: familyId,
        name: "Test Family",
        members: [
          { user_id: "user-1", role: "admin", full_name: "Admin User" },
          { user_id: "user-2", role: "member", full_name: "Member User" },
        ],
        children: [createMockChild({ family_id: familyId })],
      };

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFamily,
      } as Response);

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      // Act
      const { result } = renderHook(() => useFamilyData(familyId));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.familyDetails).toEqual(mockFamily);
      expect(result.current.members).toEqual(mockFamily.members);
      expect(result.current.children).toEqual(mockFamily.children);
    });

    it("manages loading state during fetch", async () => {
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
          json: async () => ({ id: familyId, name: "Test Family", members: [], children: [] }),
        } as Response), 100))
      );

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      // Act
      const { result } = renderHook(() => useFamilyData(familyId));

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
      const familyId = "test-family-123";
      const errorMessage = "Family not found";

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
        status: 404,
        json: async () => ({ message: errorMessage }),
      } as Response);

      // Act
      const { result } = renderHook(() => useFamilyData(familyId));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it("does nothing when familyId is null", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useFamilyData(null));

      // Assert
      await waitFor(() => {
        expect(result.current.familyDetails).toBeNull();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("refreshMembers", () => {
    it("refreshes members successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const mockMembers = [
        { user_id: "user-1", role: "admin", full_name: "Admin User" },
        { user_id: "user-2", role: "member", full_name: "Member User" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: [], children: [] }),
      } as Response);

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.familyDetails).not.toBeNull();
      });

      // Mock members refresh
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ members: mockMembers }),
      } as Response);

      // Act
      await act(async () => {
        await result.current.refreshMembers();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.members).toEqual(mockMembers);
      });
    });

    it("does nothing when familyId is null", async () => {
      // Arrange
      const { result } = renderHook(() => useFamilyData(null));

      // Act
      await result.current.refreshMembers();

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("refreshChildren", () => {
    it("refreshes children successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const mockChildren = [
        createMockChild({ family_id: familyId, name: "Child 1" }),
        createMockChild({ family_id: familyId, name: "Child 2" }),
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: [], children: [] }),
      } as Response);

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.familyDetails).not.toBeNull();
      });

      // Mock children refresh
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ children: mockChildren }),
      } as Response);

      // Act
      await act(async () => {
        await result.current.refreshChildren();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.children).toEqual(mockChildren);
      });
    });
  });

  describe("refreshInvitations", () => {
    it("refreshes invitations successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const mockInvitations = [
        { id: "inv-1", email: "test1@example.com", status: "pending" },
        { id: "inv-2", email: "test2@example.com", status: "pending" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: [], children: [] }),
      } as Response);

      // Mock initial invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.familyDetails).not.toBeNull();
      });

      // Mock invitations refresh
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: mockInvitations }),
      } as Response);

      // Act
      await act(async () => {
        await result.current.refreshInvitations();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });
    });
  });

  describe("removeMember", () => {
    it("removes member successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const userId = "user-2";
      const mockMembers = [
        { user_id: "user-1", role: "admin", full_name: "Admin User" },
        { user_id: userId, role: "member", full_name: "Member User" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: mockMembers, children: [] }),
      } as Response);

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.members).toHaveLength(2);
      });

      // Mock remove member
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      // Act
      await act(async () => {
        await result.current.removeMember(userId);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.members).toHaveLength(1);
        expect(result.current.members[0].user_id).toBe("user-1");
      });
    });

    it("does nothing when familyId is null", async () => {
      // Arrange
      const { result } = renderHook(() => useFamilyData(null));

      // Act
      await result.current.removeMember("user-1");

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("removeChild", () => {
    it("removes child successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const childId = "child-2";
      const mockChildren = [
        createMockChild({ id: "child-1", family_id: familyId }),
        createMockChild({ id: childId, family_id: familyId }),
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: [], children: mockChildren }),
      } as Response);

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.children).toHaveLength(2);
      });

      // Mock remove child
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      // Act
      await act(async () => {
        await result.current.removeChild(childId);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.children).toHaveLength(1);
        expect(result.current.children[0].id).toBe("child-1");
      });
    });
  });

  describe("cancelInvitation", () => {
    it("cancels invitation successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const invitationId = "inv-2";
      const mockInvitations = [
        { id: "inv-1", email: "test1@example.com", status: "pending" },
        { id: invitationId, email: "test2@example.com", status: "pending" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: [], children: [] }),
      } as Response);

      // Mock initial invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: mockInvitations }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.invitations).toHaveLength(2);
      });

      // Mock cancel invitation
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      // Act
      await act(async () => {
        await result.current.cancelInvitation(invitationId);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.invitations).toHaveLength(1);
        expect(result.current.invitations[0].id).toBe("inv-1");
      });
    });
  });

  describe("updateMemberRole", () => {
    it("updates member role successfully", async () => {
      // Arrange
      const mockSession = {
        access_token: "mock-token",
      };
      const familyId = "test-family-123";
      const userId = "user-2";
      const mockMembers = [
        { user_id: "user-1", role: "admin" as const, full_name: "Admin User" },
        { user_id: userId, role: "member" as const, full_name: "Member User" },
      ];

      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);

      // Mock initial family fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: familyId, name: "Test Family", members: mockMembers, children: [] }),
      } as Response);

      // Mock invitations fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invitations: [] }),
      } as Response);

      const { result } = renderHook(() => useFamilyData(familyId));

      await waitFor(() => {
        expect(result.current.members).toHaveLength(2);
      });

      // Mock update role
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      // Act
      await act(async () => {
        await result.current.updateMemberRole(userId, "admin");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.members[1].role).toBe("admin");
      });
    });

    it("does nothing when familyId is null", async () => {
      // Arrange
      const { result } = renderHook(() => useFamilyData(null));

      // Act
      await result.current.updateMemberRole("user-1", "admin");

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

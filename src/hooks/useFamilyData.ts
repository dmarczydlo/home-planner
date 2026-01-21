import { useState, useCallback, useEffect } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type {
  FamilyDetailsDTO,
  FamilyMemberDTO,
  ChildDTO,
  InvitationWithInviterDTO,
  ListFamilyMembersResponseDTO,
  ListChildrenResponseDTO,
  ListInvitationsResponseDTO,
} from "@/types";

interface UseFamilyDataReturn {
  familyDetails: FamilyDetailsDTO | null;
  members: FamilyMemberDTO[];
  children: ChildDTO[];
  invitations: InvitationWithInviterDTO[];
  isLoading: boolean;
  error: string | null;
  refreshFamily: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshChildren: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  removeChild: (childId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: "admin" | "member") => Promise<void>;
}

export function useFamilyData(familyId: string | null): UseFamilyDataReturn {
  const [familyDetails, setFamilyDetails] = useState<FamilyDetailsDTO | null>(null);
  const [members, setMembers] = useState<FamilyMemberDTO[]>([]);
  const [children, setChildren] = useState<ChildDTO[]>([]);
  const [invitations, setInvitations] = useState<InvitationWithInviterDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const supabase = createSupabaseClientForAuth();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }, []);

  const refreshFamily = useCallback(async () => {
    if (!familyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/families/${familyId}`, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch family details");
      }

      const data: FamilyDetailsDTO = await response.json();
      setFamilyDetails(data);
      setMembers(data.members);
      setChildren(data.children);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch family details";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [familyId, getAuthHeaders]);

  const refreshMembers = useCallback(async () => {
    if (!familyId) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/families/${familyId}/members`, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch members");
      }

      const data: ListFamilyMembersResponseDTO = await response.json();
      setMembers(data.members);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch members";
      setError(errorMessage);
      throw err;
    }
  }, [familyId, getAuthHeaders]);

  const refreshChildren = useCallback(async () => {
    if (!familyId) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/families/${familyId}/children`, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch children");
      }

      const data: ListChildrenResponseDTO = await response.json();
      setChildren(data.children);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch children";
      setError(errorMessage);
      throw err;
    }
  }, [familyId, getAuthHeaders]);

  const refreshInvitations = useCallback(async () => {
    if (!familyId) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/families/${familyId}/invitations?status=pending`, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch invitations");
      }

      const data: ListInvitationsResponseDTO = await response.json();
      setInvitations(data.invitations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch invitations";
      setError(errorMessage);
      throw err;
    }
  }, [familyId, getAuthHeaders]);

  const removeMember = useCallback(
    async (userId: string) => {
      if (!familyId) return;

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/families/${familyId}/members/${userId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to remove member");
        }

        setMembers((prev) => prev.filter((member) => member.user_id !== userId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to remove member";
        setError(errorMessage);
        throw err;
      }
    },
    [familyId, getAuthHeaders]
  );

  const removeChild = useCallback(
    async (childId: string) => {
      if (!familyId) return;

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/families/${familyId}/children/${childId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to remove child");
        }

        setChildren((prev) => prev.filter((child) => child.id !== childId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to remove child";
        setError(errorMessage);
        throw err;
      }
    },
    [familyId, getAuthHeaders]
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!familyId) return;

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/families/${familyId}/invitations/${invitationId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to cancel invitation");
        }

        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to cancel invitation";
        setError(errorMessage);
        throw err;
      }
    },
    [familyId, getAuthHeaders]
  );

  const updateMemberRole = useCallback(
    async (userId: string, role: "admin" | "member") => {
      if (!familyId) return;

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/families/${familyId}/members/${userId}/role`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update member role");
        }

        setMembers((prev) => prev.map((member) => (member.user_id === userId ? { ...member, role } : member)));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update member role";
        setError(errorMessage);
        throw err;
      }
    },
    [familyId, getAuthHeaders]
  );

  useEffect(() => {
    if (familyId) {
      Promise.all([
        refreshFamily().catch((err) => {
          console.error("Failed to refresh family on mount:", err);
        }),
        refreshInvitations().catch((err) => {
          console.error("Failed to refresh invitations on mount:", err);
        }),
      ]);
    }
  }, [familyId, refreshFamily, refreshInvitations]);

  return {
    familyDetails,
    members,
    children,
    invitations,
    isLoading,
    error,
    refreshFamily,
    refreshMembers,
    refreshChildren,
    refreshInvitations,
    removeMember,
    removeChild,
    cancelInvitation,
    updateMemberRole,
  };
}

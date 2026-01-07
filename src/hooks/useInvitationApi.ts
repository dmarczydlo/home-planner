import { useState, useCallback } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { CreateInvitationCommand, CreateInvitationResponseDTO } from "@/types";

interface UseInvitationApiReturn {
  createInvitation: (familyId: string, command: CreateInvitationCommand) => Promise<CreateInvitationResponseDTO>;
  isCreating: boolean;
  error: string | null;
}

export function useInvitationApi(): UseInvitationApiReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvitation = useCallback(
    async (familyId: string, command: CreateInvitationCommand): Promise<CreateInvitationResponseDTO> => {
      setIsCreating(true);
      setError(null);

      try {
        const supabase = createSupabaseClientForAuth();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const response = await fetch(`/api/families/${familyId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to send invitation: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send invitation";
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return { createInvitation, isCreating, error };
}


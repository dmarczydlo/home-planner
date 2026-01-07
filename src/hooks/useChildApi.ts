import { useState, useCallback } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { CreateChildCommand, ChildDTO } from "@/types";

interface UseChildApiReturn {
  createChild: (familyId: string, command: CreateChildCommand) => Promise<ChildDTO>;
  isCreating: boolean;
  error: string | null;
}

export function useChildApi(): UseChildApiReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChild = useCallback(
    async (familyId: string, command: CreateChildCommand): Promise<ChildDTO> => {
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

        const response = await fetch(`/api/families/${familyId}/children`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to add child: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add child";
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return { createChild, isCreating, error };
}


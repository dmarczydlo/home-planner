import { useState, useCallback } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { CreateFamilyResponseDTO, CreateFamilyCommand } from "@/types";

interface UseFamilyApiReturn {
  createFamily: (command: CreateFamilyCommand) => Promise<CreateFamilyResponseDTO>;
  isCreating: boolean;
  error: string | null;
}

export function useFamilyApi(): UseFamilyApiReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFamily = useCallback(async (command: CreateFamilyCommand): Promise<CreateFamilyResponseDTO> => {
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

      const response = await fetch("/api/families", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create family: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create family";
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createFamily, isCreating, error };
}


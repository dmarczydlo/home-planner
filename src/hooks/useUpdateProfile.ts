import { useState } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { UpdateUserCommand } from "@/types";

async function updateUserProfile(command: UpdateUserCommand): Promise<void> {
  const supabase = createSupabaseClientForAuth();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch("/api/users/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update profile");
  }
}

export function useUpdateProfile() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (command: UpdateUserCommand) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(command);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateProfile,
    isUpdating,
  };
}

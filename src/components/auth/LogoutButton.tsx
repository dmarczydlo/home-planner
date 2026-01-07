import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function LogoutButton({ variant = "ghost", size = "default", className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const supabase = createSupabaseClientForAuth();
      await supabase.auth.signOut();

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant={variant} size={size} className={className}>
      {isLoading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}

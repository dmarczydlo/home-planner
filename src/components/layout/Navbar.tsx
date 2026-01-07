import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClientForAuth();

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("supabase") || e.key?.includes("sb-")) {
        checkSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check session on window focus (catches navigation from OAuth)
    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (loading) {
    return null; // or a loading skeleton
  }

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              Home Planner
            </a>
            {user && (
              <div className="hidden md:flex items-center gap-4">
                <a
                  href="/calendar/week"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Calendar
                </a>
                <a
                  href="/onboarding/welcome"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Settings
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">{user.email}</span>
                <LogoutButton variant="outline" size="sm" />
              </>
            ) : (
              <Button asChild variant="default" size="sm">
                <a href="/auth/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

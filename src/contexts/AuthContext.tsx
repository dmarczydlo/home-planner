import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { UserProfileDTO } from "@/types";

interface AuthError {
  message: string;
  code?: string;
  retryable?: boolean;
}

interface AuthContextType {
  user: UserProfileDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createSupabaseClientForAuth();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserProfile = useCallback(
    async (userId: string, retryCount = 0): Promise<UserProfileDTO | null> => {
      const maxRetries = 2;
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          return null;
        }

        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            await supabase.auth.signOut();
            setError({
              message: "Your session has expired. Please sign in again.",
              code: "SESSION_EXPIRED",
              retryable: false,
            });
            return null;
          }

          if (response.status >= 500 && retryCount < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchUserProfile(userId, retryCount + 1);
          }

          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }

        const data = await response.json();
        setError(null);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load user profile";
        const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("network");

        if (isNetworkError && retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchUserProfile(userId, retryCount + 1);
        }

        console.error("Error fetching user profile:", error);
        setError({
          message: isNetworkError
            ? "Connection failed. Please check your internet connection."
            : "Failed to load your profile. Please try again.",
          code: isNetworkError ? "NETWORK_ERROR" : "PROFILE_FETCH_ERROR",
          retryable: true,
        });
        return null;
      }
    },
    [supabase]
  );

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userProfile = await fetchUserProfile(session.user.id);
      setUser(userProfile);
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
      setError({
        message: "Failed to verify authentication. Please try again.",
        code: "AUTH_CHECK_ERROR",
        retryable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchUserProfile]);

  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      return;
    }

    const userProfile = await fetchUserProfile(session.user.id);
    setUser(userProfile);
  }, [supabase, fetchUserProfile]);

  const login = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError({
        message: "Failed to sign out. Please try again.",
        code: "LOGOUT_ERROR",
        retryable: true,
      });
    }
  }, [supabase]);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setUser(userProfile);
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setUser(userProfile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth, supabase, fetchUserProfile]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

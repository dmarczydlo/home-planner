import { Branding } from "./Branding";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { LegalLinks } from "./LegalLinks";
import type { ReactNode } from "react";

interface LoginViewProps {
  error?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
  no_code: "Missing authentication code. Please try signing in again.",
  session_failed: "Failed to create session. Please try again.",
  user_not_found: "User account not found. Please contact support.",
  user_creation_failed: "Failed to create user account. Please try again.",
  unexpected_error: "An unexpected error occurred. Please try again.",
};

export function LoginView({ error }: LoginViewProps): ReactNode {
  const errorMessage = error ? ERROR_MESSAGES[error] || "An error occurred. Please try again." : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-2xl shadow-xl p-8 sm:p-10 space-y-8">
          <Branding />
          {errorMessage && (
            <div
              className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2"
              role="alert"
              aria-live="polite"
            >
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to manage your family calendar</p>
            </div>
            <GoogleSignInButton />
          </div>
        </div>
        <div className="text-center">
          <LegalLinks />
        </div>
      </div>
    </div>
  );
}

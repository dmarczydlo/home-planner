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
    <div className="flex min-h-screen items-center justify-center p-6 sm:p-8 md:p-10">
      <div className="w-full max-w-[400px] md:max-w-[480px] space-y-8">
        <Branding />
        {errorMessage && (
          <div
            className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200"
            role="alert"
            aria-live="polite"
          >
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}
        <GoogleSignInButton />
        <LegalLinks />
      </div>
    </div>
  );
}


import { useState, type ReactNode } from "react";
import { signInWithGoogle } from "@/lib/auth/supabaseAuth";
import { Button } from "@/components/ui/button";

interface GoogleSignInButtonProps {
  onError?: (error: string) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps): ReactNode {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 2;

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
        return "Connection failed. Please check your internet connection.";
      }
      if (message.includes("popup") || message.includes("blocked")) {
        return "Popup blocked. Please allow popups for this site and try again.";
      }
      return err.message;
    }
    return "Sign in failed. Please try again.";
  };

  const handleSignIn = async (isRetry = false) => {
    if (!isRetry) {
      setRetryCount(0);
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      const isNetworkError = errorMessage.includes("Connection failed");

      if (isNetworkError && retryCount < MAX_RETRIES) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        setIsLoading(false);

        setTimeout(() => {
          handleSignIn(true);
        }, 1000 * newRetryCount);
        return;
      }

      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  };

  return (
    <div className="w-full space-y-3">
      <Button
        onClick={() => handleSignIn(false)}
        disabled={isLoading}
        size="lg"
        className="w-full h-14 text-base font-semibold bg-white dark:bg-card text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Sign in with Google account"
        aria-describedby="signin-description"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin size-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Redirecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </Button>
      <p id="signin-description" className="sr-only">
        Opens Google authentication in a new window
      </p>
      {error && (
        <div
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive space-y-3 animate-in fade-in slide-in-from-top-2"
          role="alert"
          aria-live="polite"
        >
          <div>
            <p className="font-semibold">Sign in failed</p>
            <p className="mt-1">{error}</p>
          </div>
          <Button
            onClick={() => handleSignIn(false)}
            variant="outline"
            size="sm"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

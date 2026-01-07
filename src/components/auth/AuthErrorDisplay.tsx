import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AuthErrorDisplay(): ReactNode {
  const { error, clearError, checkAuth } = useAuth();

  if (!error) {
    return null;
  }

  return (
    <div
      className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200 space-y-3"
      role="alert"
      aria-live="polite"
    >
      <div>
        <p className="font-medium">Authentication Error</p>
        <p>{error.message}</p>
      </div>
      {error.retryable && (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              clearError();
              checkAuth();
            }}
            variant="outline"
            size="sm"
            className="border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            Retry
          </Button>
          <Button
            onClick={clearError}
            variant="ghost"
            size="sm"
            className="text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            Dismiss
          </Button>
        </div>
      )}
      {!error.retryable && (
        <Button
          onClick={clearError}
          variant="ghost"
          size="sm"
          className="text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"
        >
          Dismiss
        </Button>
      )}
    </div>
  );
}

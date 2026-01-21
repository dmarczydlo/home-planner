import { useState, useEffect } from "react";
import { ProviderCard } from "./ProviderCard";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useCalendarApi } from "@/hooks/useCalendarApi";
import { cn } from "@/lib/utils";
import type { CalendarProvider } from "@/types";

interface ConnectCalendarStepProps {
  className?: string;
}

export function ConnectCalendarStep({ className }: ConnectCalendarStepProps) {
  const { state, addCalendar } = useOnboarding();
  const { connectCalendar, listCalendars, isConnecting, error: apiError } = useCalendarApi();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const calendarId = urlParams.get("calendar_id");
    const errorParam = urlParams.get("error");

    if (status !== "error" && status !== "success") {
      return;
    }

    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);

    if (status === "error" && errorParam) {
      const errorMessages: Record<string, string> = {
        missing_parameters: "Missing required parameters. Please try again.",
        validation: "Invalid request. Please try again.",
        unauthorized: "Authentication failed. Please try again.",
        forbidden: "You don't have permission to connect this calendar.",
        not_found: "Calendar not found. Please try again.",
        conflict: "This calendar is already connected.",
        internal_error: "An internal error occurred. Please try again.",
      };
      setError(errorMessages[errorParam] || "Failed to connect calendar. Please try again.");
      return;
    }

    if (status === "success" && !calendarId) {
      return;
    }

    if (status === "success" && calendarId) {
      listCalendars()
        .then((calendars) => {
          const newCalendar = calendars.find((cal) => cal.id === calendarId);
          if (!newCalendar) {
            return;
          }

          if (state.connectedCalendars.some((cal) => cal.id === calendarId)) {
            return;
          }

          addCalendar(newCalendar);
        })
        .catch(() => {
          setError("Failed to load calendar details. Please try again.");
        });
    }
  }, [listCalendars, addCalendar, state.connectedCalendars]);

  const handleProviderClick = async (provider: CalendarProvider) => {
    setError(null);

    try {
      const returnPath = typeof window !== "undefined" ? window.location.pathname : undefined;
      const response = await connectCalendar({ provider, return_path: returnPath });

      if (!response.authorization_url) {
        if (response.calendar) {
          addCalendar(response.calendar);
        }
        return;
      }

      window.location.href = response.authorization_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect calendar. Please try again.";
      setError(errorMessage);
    }
  };

  const displayError = error || apiError;
  const isGoogleConnected = state.connectedCalendars.some((cal) => cal.provider === "google");
  const isMicrosoftConnected = state.connectedCalendars.some((cal) => cal.provider === "microsoft");

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" id="step-title">
          Connect Your Calendar
        </h1>
        <p className="text-muted-foreground">Sync your external calendars to see all your events in one place.</p>
      </div>

      {displayError && (
        <div
          className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <p className="font-medium">{displayError}</p>
        </div>
      )}

      <div className="space-y-4">
        <ProviderCard
          provider="google"
          name="Google Calendar"
          description="Sync events from your Google Calendar"
          isConnected={isGoogleConnected}
          onClick={() => handleProviderClick("google")}
          disabled={isConnecting || isGoogleConnected}
        />

        <ProviderCard
          provider="microsoft"
          name="Microsoft 365"
          description="Sync events from your Outlook calendar"
          isConnected={isMicrosoftConnected}
          onClick={() => handleProviderClick("microsoft")}
          disabled={isConnecting || isMicrosoftConnected}
        />
      </div>

      <p className="text-sm text-muted-foreground">You can skip this step and add calendars later from Settings.</p>
    </div>
  );
}

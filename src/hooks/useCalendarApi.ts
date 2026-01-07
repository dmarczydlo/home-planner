import { useState, useCallback } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type {
  CalendarAuthResponseDTO,
  ConnectCalendarCommand,
  ExternalCalendarSummaryDTO,
  ListExternalCalendarsResponseDTO,
} from "@/types";

interface UseCalendarApiReturn {
  connectCalendar: (command: ConnectCalendarCommand) => Promise<CalendarAuthResponseDTO & { calendar?: ExternalCalendarSummaryDTO }>;
  listCalendars: () => Promise<ExternalCalendarSummaryDTO[]>;
  isConnecting: boolean;
  error: string | null;
}

export function useCalendarApi(): UseCalendarApiReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectCalendar = useCallback(
    async (command: ConnectCalendarCommand): Promise<CalendarAuthResponseDTO & { calendar?: ExternalCalendarSummaryDTO }> => {
      setIsConnecting(true);
      setError(null);

      try {
        const supabase = createSupabaseClientForAuth();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const response = await fetch("/api/external-calendars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to connect calendar: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to connect calendar";
        setError(errorMessage);
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  const listCalendars = useCallback(async (): Promise<ExternalCalendarSummaryDTO[]> => {
    setError(null);

    try {
      const supabase = createSupabaseClientForAuth();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/external-calendars", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to list calendars: ${response.statusText}`);
      }

      const data: ListExternalCalendarsResponseDTO = await response.json();
      return data.calendars;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to list calendars";
      setError(errorMessage);
      throw err;
    }
  }, []);

  return { connectCalendar, listCalendars, isConnecting, error };
}


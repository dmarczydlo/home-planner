import { useState, useCallback, useEffect } from "react";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type {
  ExternalCalendarSummaryDTO,
  CalendarSyncResultDTO,
} from "@/types";

interface UseExternalCalendarsReturn {
  calendars: ExternalCalendarSummaryDTO[];
  isLoading: boolean;
  error: string | null;
  syncStatus: Record<string, "idle" | "syncing" | "success" | "error">;
  loadCalendars: () => Promise<void>;
  syncCalendar: (calendarId: string) => Promise<CalendarSyncResultDTO>;
  syncAllCalendars: () => Promise<void>;
  disconnectCalendar: (calendarId: string) => Promise<void>;
}

export function useExternalCalendars(): UseExternalCalendarsReturn {
  const [calendars, setCalendars] = useState<ExternalCalendarSummaryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, "idle" | "syncing" | "success" | "error">>({});

  const getAuthHeaders = useCallback(async () => {
    const supabase = createSupabaseClientForAuth();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }, []);

  const loadCalendars = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/external-calendars", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load calendars: ${response.statusText}`);
      }

      const data = await response.json();
      setCalendars(data.calendars || []);
      
      const initialSyncStatus: Record<string, "idle" | "syncing" | "success" | "error"> = {};
      data.calendars?.forEach((cal: ExternalCalendarSummaryDTO) => {
        initialSyncStatus[cal.id] = "idle";
      });
      setSyncStatus(initialSyncStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load calendars";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const syncCalendar = useCallback(
    async (calendarId: string): Promise<CalendarSyncResultDTO> => {
      setSyncStatus((prev) => ({ ...prev, [calendarId]: "syncing" }));
      setError(null);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/external-calendars/${calendarId}/sync`, {
          method: "POST",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to sync calendar: ${response.statusText}`);
        }

        const result: CalendarSyncResultDTO = await response.json();
        
        setSyncStatus((prev) => ({ 
          ...prev, 
          [calendarId]: result.status === "success" ? "success" : "error" 
        }));

        await loadCalendars();

        setTimeout(() => {
          setSyncStatus((prev) => ({ ...prev, [calendarId]: "idle" }));
        }, 3000);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to sync calendar";
        setError(errorMessage);
        setSyncStatus((prev) => ({ ...prev, [calendarId]: "error" }));
        
        setTimeout(() => {
          setSyncStatus((prev) => ({ ...prev, [calendarId]: "idle" }));
        }, 3000);
        
        throw err;
      }
    },
    [getAuthHeaders, loadCalendars]
  );

  const syncAllCalendars = useCallback(async () => {
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/external-calendars/sync", {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to sync all calendars: ${response.statusText}`);
      }

      await loadCalendars();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sync all calendars";
      setError(errorMessage);
      throw err;
    }
  }, [getAuthHeaders, loadCalendars]);

  const disconnectCalendar = useCallback(
    async (calendarId: string) => {
      setError(null);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/external-calendars/${calendarId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to disconnect calendar: ${response.statusText}`);
        }

        setCalendars((prev) => prev.filter((cal) => cal.id !== calendarId));
        setSyncStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[calendarId];
          return newStatus;
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to disconnect calendar";
        setError(errorMessage);
        throw err;
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  return {
    calendars,
    isLoading,
    error,
    syncStatus,
    loadCalendars,
    syncCalendar,
    syncAllCalendars,
    disconnectCalendar,
  };
}

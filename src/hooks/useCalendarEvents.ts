import { useEffect } from "react";
import { useCalendar } from "../contexts/CalendarContext";
import { getDateRange, toISODate } from "../lib/calendar/dateUtils";
import type { EventWithParticipantsDTO } from "../types";

interface FetchEventsParams {
  familyId: string;
  startDate: string;
  endDate: string;
  participantIds?: string[];
  eventType?: "elastic" | "blocker";
  includeSynced?: boolean;
}

async function fetchEvents(params: FetchEventsParams): Promise<EventWithParticipantsDTO[]> {
  const queryParams = new URLSearchParams({
    family_id: params.familyId,
    start_date: params.startDate,
    end_date: params.endDate,
    include_synced: String(params.includeSynced ?? true),
  });

  if (params.participantIds && params.participantIds.length > 0) {
    queryParams.set("participant_ids", params.participantIds.join(","));
  }

  if (params.eventType) {
    queryParams.set("event_type", params.eventType);
  }

  const response = await fetch(`/api/events?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.events || [];
}

export function useCalendarEvents(familyId: string) {
  const {
    state,
    setEvents,
    setIsLoading,
    setError,
    setDateRange,
  } = useCalendar();

  useEffect(() => {
    const dateRange = getDateRange(state.view, state.currentDate);
    setDateRange(dateRange);

    const loadEvents = async () => {
      if (!familyId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const events = await fetchEvents({
          familyId,
          startDate: toISODate(dateRange.start),
          endDate: toISODate(dateRange.end),
          participantIds: state.filters.participantIds.length > 0 
            ? state.filters.participantIds 
            : undefined,
          eventType: state.filters.eventType,
          includeSynced: true,
        });

        setEvents(events);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load events"));
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [
    familyId,
    state.view,
    state.currentDate,
    state.filters.participantIds,
    state.filters.eventType,
    setEvents,
    setIsLoading,
    setError,
    setDateRange,
  ]);

  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
  };
}

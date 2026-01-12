import { useEffect, useCallback } from "react";
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
  signal?: AbortSignal;
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

  const response = await fetch(`/api/events?${queryParams.toString()}`, {
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.events || [];
}

export function useCalendarEvents(familyId: string) {
  const { state, setEvents, setIsLoading, setError, setDateRange } = useCalendar();

  const loadEvents = useCallback(
    async (signal?: AbortSignal) => {
      if (!familyId) {
        return;
      }

      const dateRange = getDateRange(state.view, state.currentDate);

      setIsLoading(true);
      setError(null);

      try {
        const events = await fetchEvents({
          familyId,
          startDate: toISODate(dateRange.start),
          endDate: toISODate(dateRange.end),
          participantIds: state.filters.participantIds.length > 0 ? state.filters.participantIds : undefined,
          eventType: state.filters.eventType,
          includeSynced: true,
          signal,
        });

        if (!signal?.aborted) {
          setEvents(events);
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err : new Error("Failed to load events"));
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [
      familyId,
      state.view,
      state.currentDate,
      state.filters.participantIds,
      state.filters.eventType,
      setEvents,
      setIsLoading,
      setError,
    ]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const dateRange = getDateRange(state.view, state.currentDate);
    setDateRange(dateRange);

    const loadEventsWithAbort = async () => {
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
          participantIds: state.filters.participantIds.length > 0 ? state.filters.participantIds : undefined,
          eventType: state.filters.eventType,
          includeSynced: true,
          signal: abortController.signal,
        });

        if (!abortController.signal.aborted) {
          setEvents(events);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error("Failed to load events"));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadEventsWithAbort();

    return () => {
      abortController.abort();
    };
  }, [
    familyId,
    state.view,
    state.currentDate,
    state.filters.participantIds,
    state.filters.eventType,
    setDateRange,
    setEvents,
    setIsLoading,
    setError,
  ]);

  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    refetch: loadEvents,
  };
}

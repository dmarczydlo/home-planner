import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { EventWithParticipantsDTO } from "../types";
import { getDateRange } from "../lib/calendar/dateUtils";

type CalendarView = "day" | "week" | "month" | "agenda";

interface CalendarFilters {
  participantIds: string[];
  eventType?: "elastic" | "blocker";
}

interface CalendarState {
  events: EventWithParticipantsDTO[];
  view: CalendarView;
  currentDate: Date;
  dateRange: { start: Date; end: Date };
  filters: CalendarFilters;
  isLoading: boolean;
  error: Error | null;
}

interface CalendarContextType {
  state: CalendarState;
  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  setEvents: (events: EventWithParticipantsDTO[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
  initialView?: CalendarView;
  initialDate?: Date;
}

export function CalendarProvider({ 
  children, 
  initialView = "week",
  initialDate = new Date()
}: CalendarProviderProps) {
  const [state, setState] = useState<CalendarState>(() => {
    const initialRange = getDateRange(initialView, initialDate);
    return {
      events: [],
      view: initialView,
      currentDate: initialDate,
      dateRange: initialRange,
      filters: {
        participantIds: [],
      },
      isLoading: false,
      error: null,
    };
  });

  const setView = useCallback((view: CalendarView) => {
    setState((prev) => ({ ...prev, view }));
  }, []);

  const setCurrentDate = useCallback((date: Date) => {
    setState((prev) => ({ ...prev, currentDate: date }));
  }, []);

  const setFilters = useCallback((filters: Partial<CalendarFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  const setEvents = useCallback((events: EventWithParticipantsDTO[]) => {
    setState((prev) => ({ ...prev, events }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setDateRange = useCallback((range: { start: Date; end: Date }) => {
    setState((prev) => ({ ...prev, dateRange: range }));
  }, []);

  const value: CalendarContextType = {
    state,
    setView,
    setCurrentDate,
    setFilters,
    setEvents,
    setIsLoading,
    setError,
    setDateRange,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

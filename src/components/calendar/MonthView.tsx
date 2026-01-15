import { useMemo } from "react";
// @ts-ignore - CommonJS module compatibility
import { Calendar } from "react-big-calendar";
import { useCalendar } from "../../contexts/CalendarContext";
import { localizer } from "../../lib/calendar/localizer";
import type { EventWithParticipantsDTO } from "../../types";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface MonthViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
  onSelectEvent?: (event: EventWithParticipantsDTO) => void;
}

export function MonthView({ events, isLoading, onSelectEvent }: MonthViewProps) {
  const { state, setCurrentDate, setView } = useCalendar();

  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: event.is_all_day,
      resource: {
        event_type: event.event_type,
        has_conflict: event.has_conflict,
        is_synced: event.is_synced,
        participants: event.participants,
      },
    }));
  }, [events]);

  const eventStyleGetter = (event: any) => {
    const isBlocker = event.resource?.event_type === "blocker";
    const hasConflict = event.resource?.has_conflict;
    const isSynced = event.resource?.is_synced;

    let style: React.CSSProperties = {
      backgroundColor: isBlocker
        ? hasConflict
          ? "#ef4444"
          : "#3b82f6"
        : "#6b7280",
      color: "white",
      borderRadius: "4px",
      border: "none",
      padding: "2px 4px",
      fontSize: "12px",
    };

    if (isSynced) {
      style.opacity = 0.8;
    }

    return { style };
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setCurrentDate(start);
    setView("day");
  };

  const handleSelectEvent = (event: any) => {
    const originalEvent = events.find((e) => e.id === event.id);
    if (originalEvent && onSelectEvent) {
      // For recurring events, store the occurrence date in the event object
      const eventWithOccurrence = {
        ...originalEvent,
        _occurrenceDate: event.start ? new Date(event.start).toISOString().split("T")[0] : undefined,
      };
      onSelectEvent(eventWithOccurrence);
    }
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        view="month"
        date={state.currentDate}
        onNavigate={handleNavigate}
        onView={() => {}}
        eventPropGetter={eventStyleGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        popup
        components={{
          toolbar: () => null,
        }}
        className="rbc-calendar"
      />
    </div>
  );
}

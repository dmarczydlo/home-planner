import { useMemo } from "react";
// @ts-ignore - CommonJS module compatibility
import { Calendar } from "react-big-calendar";
import { useCalendar } from "../../contexts/CalendarContext";
import { localizer } from "../../lib/calendar/localizer";
import type { EventWithParticipantsDTO } from "../../types";
import "../../styles/calendar.css";

interface WeekViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
  onSelectEvent?: (event: EventWithParticipantsDTO) => void;
}

export function WeekView({ events, isLoading, onSelectEvent }: WeekViewProps) {
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

    let backgroundColor = "oklch(0.65 0.25 280)";
    let color = "oklch(1 0 0)";

    if (isBlocker) {
      if (hasConflict) {
        backgroundColor = "oklch(0.55 0.22 25)";
      } else {
        backgroundColor = "oklch(0.60 0.16 220)";
      }
    } else {
      backgroundColor = "oklch(0.55 0.28 300)";
    }

    let style: React.CSSProperties = {
      backgroundColor,
      color,
      border: "none",
      opacity: isSynced ? 0.75 : 1,
    };

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
    <div className="h-full p-6">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        view="week"
        date={state.currentDate}
        onNavigate={handleNavigate}
        onView={() => {}}
        eventPropGetter={eventStyleGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        popup
        step={30}
        timeslots={2}
        min={new Date(2024, 0, 1, 6, 0)}
        max={new Date(2024, 0, 1, 23, 0)}
        components={{
          toolbar: () => null,
        }}
        className="rbc-calendar"
      />
    </div>
  );
}

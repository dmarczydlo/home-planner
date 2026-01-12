import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import { useCalendar } from "../../contexts/CalendarContext";
import type { EventWithParticipantsDTO } from "../../types";

interface MonthViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
}

function getMonthDays(currentDate: Date): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

function getEventsForDay(events: EventWithParticipantsDTO[], day: Date): EventWithParticipantsDTO[] {
  return events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return isSameDay(eventDate, day);
  });
}

export function MonthView({ events, isLoading }: MonthViewProps) {
  const { state, setView, setCurrentDate } = useCalendar();
  const currentDate = state.currentDate;
  const monthDays = getMonthDays(currentDate);

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView("day");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const isDayToday = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[80px] sm:min-h-[100px] p-2 rounded-lg border transition-all
                ${
                  isDayToday
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
                ${!isCurrentMonth ? "opacity-50" : ""}
              `}
            >
              {/* Day number */}
              <div
                className={`
                  text-sm font-semibold mb-1
                  ${
                    isDayToday
                      ? "text-blue-600 dark:text-blue-400"
                      : isCurrentMonth
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-600"
                  }
                `}
              >
                {format(day, "d")}
              </div>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`
                        text-xs truncate px-1 py-0.5 rounded
                        ${
                          event.event_type === "blocker"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }
                      `}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

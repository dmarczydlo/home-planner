import { format, isSameDay, isToday } from "date-fns";
import { useCalendar } from "../../contexts/CalendarContext";
import { EventCard } from "./EventCard";
import type { EventWithParticipantsDTO } from "../../types";

interface WeekViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
}

function getWeekDays(currentDate: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  return days;
}

function getEventsForDay(events: EventWithParticipantsDTO[], day: Date): EventWithParticipantsDTO[] {
  return events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return isSameDay(eventDate, day);
  });
}

export function WeekView({ events, isLoading }: WeekViewProps) {
  const { state } = useCalendar();
  const weekDays = getWeekDays(state.currentDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Week days grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className="flex flex-col min-h-[120px]"
            >
              {/* Day header */}
              <div
                className={`
                  text-center py-2 mb-2 rounded-lg
                  ${
                    isDayToday
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-gray-50 dark:bg-gray-800"
                  }
                `}
              >
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`
                    text-lg font-bold
                    ${
                      isDayToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }
                  `}
                >
                  {format(day, "d")}
                </div>
              </div>

              {/* Events for this day */}
              <div className="space-y-2 flex-1">
                {dayEvents.length === 0 ? (
                  <div className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                    No events
                  </div>
                ) : (
                  dayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact={true}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

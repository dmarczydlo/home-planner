import { format, isToday as isTodayFn } from "date-fns";
import { useCalendar } from "../../contexts/CalendarContext";
import { EventCard } from "./EventCard";
import type { EventWithParticipantsDTO } from "../../types";

interface DayViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

function getEventHour(event: EventWithParticipantsDTO): number {
  const startTime = new Date(event.start_time);
  return startTime.getHours();
}

function isAllDayEvent(event: EventWithParticipantsDTO): boolean {
  return event.is_all_day;
}

export function DayView({ events, isLoading }: DayViewProps) {
  const { state } = useCalendar();
  const currentDate = state.currentDate;
  const isDayToday = isTodayFn(currentDate);

  const allDayEvents = events.filter(isAllDayEvent);
  const timedEvents = events.filter((e) => !isAllDayEvent(e));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
            All Day
          </h3>
          <div className="space-y-2">
            {allDayEvents.map((event) => (
              <EventCard key={event.id} event={event} compact={true} />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {HOURS.map((hour) => {
            const hourEvents = timedEvents.filter(
              (event) => getEventHour(event) === hour
            );

            const isCurrentHour =
              isDayToday && new Date().getHours() === hour;

            return (
              <div key={hour} className="flex gap-4">
                {/* Time label */}
                <div className="w-20 flex-shrink-0 text-right">
                  <span
                    className={`
                      text-sm font-medium
                      ${
                        isCurrentHour
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }
                    `}
                  >
                    {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                  </span>
                </div>

                {/* Hour slot */}
                <div className="flex-1 min-h-[60px] border-t border-gray-200 dark:border-gray-700 pt-2">
                  {isCurrentHour && (
                    <div className="absolute left-0 right-0 border-t-2 border-blue-500 dark:border-blue-400" />
                  )}
                  {hourEvents.length > 0 && (
                    <div className="space-y-2">
                      {hourEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

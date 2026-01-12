import { format, isSameDay, isToday, parseISO } from "date-fns";
import { EventCard } from "./EventCard";
import type { EventWithParticipantsDTO } from "../../types";

interface AgendaViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
}

interface GroupedEvents {
  [dateKey: string]: {
    date: Date;
    events: EventWithParticipantsDTO[];
  };
}

function groupEventsByDate(events: EventWithParticipantsDTO[]): GroupedEvents {
  const grouped: GroupedEvents = {};

  events.forEach((event) => {
    const eventDate = parseISO(event.start_time);
    const dateKey = format(eventDate, "yyyy-MM-dd");

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: eventDate,
        events: [],
      };
    }

    grouped[dateKey].events.push(event);
  });

  return grouped;
}

function sortEventsByTime(events: EventWithParticipantsDTO[]): EventWithParticipantsDTO[] {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return timeA - timeB;
  });
}

export function AgendaView({ events, isLoading }: AgendaViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No upcoming events
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Your calendar is clear for the next 30 days
          </p>
        </div>
      </div>
    );
  }

  const sortedEvents = sortEventsByTime(events);
  const groupedEvents = groupEventsByDate(sortedEvents);
  const dateKeys = Object.keys(groupedEvents).sort();

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {dateKeys.map((dateKey) => {
          const group = groupedEvents[dateKey];
          const isDayToday = isToday(group.date);

          return (
            <div key={dateKey} className="space-y-3">
              {/* Date header */}
              <div
                className={`
                  sticky top-0 z-10 py-2 px-4 -mx-4 backdrop-blur-sm
                  ${
                    isDayToday
                      ? "bg-blue-50/90 dark:bg-blue-900/30"
                      : "bg-gray-50/90 dark:bg-gray-800/90"
                  }
                `}
              >
                <h3
                  className={`
                    text-lg font-semibold
                    ${
                      isDayToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }
                  `}
                >
                  {isDayToday ? "Today" : format(group.date, "EEEE, MMMM d")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.events.length} {group.events.length === 1 ? "event" : "events"}
                </p>
              </div>

              {/* Events list */}
              <div className="space-y-3">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

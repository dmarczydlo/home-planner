import { Clock, Users, Cloud, AlertCircle } from "lucide-react";
import { formatEventTime } from "../../lib/calendar/dateUtils";
import type { EventWithParticipantsDTO } from "../../types";

interface EventCardProps {
  event: EventWithParticipantsDTO;
  onTap?: (event: EventWithParticipantsDTO) => void;
  compact?: boolean;
}

export function EventCard({ event, onTap, compact = false }: EventCardProps) {
  const isBlocker = event.event_type === "blocker";
  const hasConflict = event.has_conflict;

  const handleClick = () => {
    onTap?.(event);
  };

  const borderClass = hasConflict
    ? "border-red-500 dark:border-red-400"
    : isBlocker
      ? "border-blue-500 dark:border-blue-400"
      : "border-dashed border-gray-300 dark:border-gray-600";

  const bgClass = hasConflict
    ? "bg-red-50 dark:bg-red-900/20"
    : isBlocker
      ? "bg-blue-50 dark:bg-blue-900/20"
      : "bg-gray-50 dark:bg-gray-800/50";

  const shadowClass = event.is_synced
    ? "shadow-md"
    : "shadow-sm";

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`
          w-full text-left px-2 py-1 rounded border-l-2 ${borderClass} ${bgClass}
          hover:opacity-80 transition-opacity
        `}
      >
        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {event.title}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-3 rounded-lg border-2 ${borderClass} ${bgClass} ${shadowClass}
        hover:opacity-90 transition-all
      `}
    >
      <div className="space-y-2">
        {/* Header with time and type indicator */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatEventTime(event.start_time, event.end_time, event.is_all_day)}</span>
          </div>
          <div className="flex items-center gap-1">
            {event.is_synced && (
              <div
                className="p-1 rounded bg-green-100 dark:bg-green-900/30"
                title="Synced from external calendar"
              >
                <Cloud className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
            )}
            {hasConflict && (
              <div
                className="p-1 rounded bg-red-100 dark:bg-red-900/30"
                title="Time conflict detected"
              >
                <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>

        {/* Participants */}
        {event.participants.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">
              {event.participants.map((p) => p.name).join(", ")}
            </span>
          </div>
        )}

        {/* Event Type Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${
                isBlocker
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              }
            `}
          >
            {isBlocker ? "Blocker" : "Elastic"}
          </span>
        </div>
      </div>
    </button>
  );
}

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
    ? "border-destructive/50"
    : isBlocker
      ? "border-primary/50"
      : "border-accent/30 border-dashed";

  const bgClass = hasConflict
    ? "bg-destructive/10"
    : isBlocker
      ? "bg-primary/10"
      : "bg-accent/5";

  const shadowClass = event.is_synced
    ? "shadow-lg"
    : "shadow-md";

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`
          w-full text-left px-3 py-2 rounded-lg border-l-4 ${borderClass} ${bgClass}
          hover:shadow-md hover:scale-[1.02] transition-all duration-200
        `}
      >
        <div className="text-xs font-semibold text-foreground truncate">
          {event.title}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-4 rounded-xl border-2 ${borderClass} ${bgClass} ${shadowClass}
        hover:shadow-xl hover:scale-[1.02] transition-all duration-200
        backdrop-blur-sm
      `}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatEventTime(event.start_time, event.end_time, event.is_all_day)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {event.is_synced && (
              <div
                className="p-1.5 rounded-lg bg-success/15 backdrop-blur-sm"
                title="Synced from external calendar"
              >
                <Cloud className="w-3.5 h-3.5 text-success" />
              </div>
            )}
            {hasConflict && (
              <div
                className="p-1.5 rounded-lg bg-destructive/15 backdrop-blur-sm animate-pulse"
                title="Time conflict detected"
              >
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              </div>
            )}
          </div>
        </div>

        <h3 className="font-bold text-foreground text-base line-clamp-2 leading-snug">
          {event.title}
        </h3>

        {event.participants.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="truncate font-medium">
              {event.participants.map((p) => p.name).join(", ")}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-bold
              ${
                isBlocker
                  ? "bg-primary/20 text-primary"
                  : "bg-accent/20 text-accent"
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

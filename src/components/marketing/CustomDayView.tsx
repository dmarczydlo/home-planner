import { useMemo } from "react";

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  person: string;
  color: string;
}

interface CustomDayViewProps {
  events: Event[];
  selectedDate: Date;
}

export function CustomDayView({ events, selectedDate }: CustomDayViewProps) {
  const dayEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [events, selectedDate]);

  // Calculate the time range needed to show all events
  const timeRange = useMemo(() => {
    if (dayEvents.length === 0) {
      return { start: 8, end: 20 }; // Default 8 AM to 8 PM
    }

    let minHour = 24;
    let maxHour = 0;

    dayEvents.forEach((event) => {
      const startHour = event.start.getHours() + event.start.getMinutes() / 60;
      const endHour = event.end.getHours() + event.end.getMinutes() / 60;
      minHour = Math.min(minHour, startHour);
      maxHour = Math.max(maxHour, endHour);
    });

    // Add padding
    minHour = Math.max(0, Math.floor(minHour) - 1);
    maxHour = Math.min(24, Math.ceil(maxHour) + 1);

    return { start: minHour, end: maxHour };
  }, [dayEvents]);

  const hours = useMemo(() => {
    const hourList: number[] = [];
    for (let h = timeRange.start; h <= timeRange.end; h++) {
      hourList.push(h);
    }
    return hourList;
  }, [timeRange]);

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  const getEventPosition = (event: Event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;

    // Calculate position relative to timeRange.start
    const rangeStartMinutes = timeRange.start * 60;
    const top = ((startMinutes - rangeStartMinutes) / 60) * 60; // 60px per hour
    const height = (duration / 60) * 60;

    return { top: `${top}px`, height: `${Math.max(height, 50)}px` };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalHeight = (timeRange.end - timeRange.start) * 60;

  return (
    <div className="relative h-full w-full flex flex-col custom-day-view">
      {/* Header */}
      <div
        className={`sticky top-0 z-30 border-b border-primary/20 bg-background/95 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-4 ${
          isToday ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" : ""
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <h2
              className={`text-xl sm:text-3xl font-black ${
                isToday ? "text-primary drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]" : "text-foreground"
              }`}
            >
              {formatDate(selectedDate)}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">
              {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"} scheduled
            </p>
          </div>
          {isToday && (
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-primary/30 to-secondary/30 border border-primary/40">
              <span className="text-xs sm:text-sm font-bold text-primary">Today</span>
            </div>
          )}
        </div>
        {isToday && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-shimmer pointer-events-none" />
        )}
      </div>

      {/* Calendar area - Auto-fit height */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ minHeight: `${totalHeight}px` }}>
          {/* Time axis */}
          <div className="w-14 sm:w-20 flex-shrink-0 sticky left-0 bg-background/95 backdrop-blur-xl z-20 border-r border-primary/20">
            <div className="pt-2">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] flex items-start justify-end pr-2 sm:pr-4 text-[10px] sm:text-xs font-bold text-muted-foreground"
                >
                  {hour === 0 ? "12A" : hour < 12 ? `${hour}A` : hour === 12 ? "12P" : `${hour - 12}P`}
                </div>
              ))}
            </div>
          </div>

          {/* Main calendar area */}
          <div className="flex-1 relative" style={{ minHeight: `${totalHeight}px` }}>
            {/* Hour lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-primary/10"
                style={{ top: `${(hour - timeRange.start) * 60}px` }}
              />
            ))}

            {/* Current time indicator */}
            {isToday &&
              (() => {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const rangeStartMinutes = timeRange.start * 60;

                if (currentMinutes >= rangeStartMinutes && currentMinutes <= timeRange.end * 60) {
                  const top = ((currentMinutes - rangeStartMinutes) / 60) * 60;

                  return (
                    <div className="absolute left-0 right-0 z-10" style={{ top: `${top}px` }}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 border-2 border-background" />
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-secondary to-transparent" />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

            {/* Events */}
            <div className="relative px-4 h-full">
              {dayEvents.map((event) => {
                const position = getEventPosition(event);

                return (
                  <div
                    key={event.id}
                    className="absolute left-2 sm:left-4 right-2 sm:right-4 rounded-xl border border-white/25 backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-2xl hover:shadow-primary/40 cursor-pointer group"
                    style={{
                      ...position,
                      backgroundColor: `${event.color}ee`,
                      boxShadow: `0 8px 24px ${event.color}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    }}
                  >
                    <div className="p-2 sm:p-3 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="text-[10px] sm:text-xs font-bold text-white/90 drop-shadow-lg">
                          {formatTime(new Date(event.start))}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-white/70 drop-shadow">
                          {formatTime(new Date(event.end))}
                        </div>
                      </div>
                      <div className="text-sm sm:text-base font-black text-white drop-shadow-lg mt-0.5 sm:mt-1">
                        {event.title}
                      </div>
                      <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="text-[10px] sm:text-xs font-semibold text-white/80 drop-shadow">
                          {event.person}
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

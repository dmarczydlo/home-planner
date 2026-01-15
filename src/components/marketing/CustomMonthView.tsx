import { useMemo } from "react";

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  person: string;
  color: string;
}

interface CustomMonthViewProps {
  events: Event[];
  selectedDate: Date;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CustomMonthView({ events, selectedDate }: CustomMonthViewProps) {
  const monthStart = useMemo(() => {
    const date = new Date(selectedDate);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);

  const monthEnd = useMemo(() => {
    const date = new Date(monthStart);
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date;
  }, [monthStart]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    
    // Start from the first day of the week that contains monthStart
    const startDate = new Date(monthStart);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [monthStart]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === monthStart.getMonth() &&
      date.getFullYear() === monthStart.getFullYear()
    );
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="relative h-full w-full flex flex-col custom-month-view">
      {/* Month header */}
      <div className="sticky top-0 z-30 border-b border-primary/20 bg-background/95 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-4">
        <h2 className="text-xl sm:text-3xl font-black text-foreground">
          {formatMonthYear(monthStart)}
        </h2>
      </div>

      {/* Day names header */}
      <div className="border-b border-primary/20 bg-background/95 backdrop-blur-xl sticky top-[57px] sm:top-[73px] z-20">
        <div className="grid grid-cols-7">
          {DAYS.map((dayName, index) => (
            <div
              key={index}
              className="px-2 sm:px-4 py-2 sm:py-3 text-center"
            >
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {dayName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7" style={{ gridTemplateRows: "repeat(6, minmax(100px, 1fr))" }}>
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);
            const currentMonth = isCurrentMonth(day);
            
            return (
              <div
                key={index}
                className={`relative border-r border-b border-primary/10 p-1.5 sm:p-3 transition-all duration-300 ${
                  !currentMonth ? "opacity-40" : ""
                } ${
                  today
                    ? "bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/5"
                    : "hover:bg-card/20"
                }`}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      today
                        ? "text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        : currentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {today && (
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
                  )}
                </div>

                {/* Events */}
                <div className="space-y-0.5 sm:space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.05] hover:z-50 hover:shadow-lg cursor-pointer group overflow-hidden"
                      style={{
                        backgroundColor: `${event.color}dd`,
                        boxShadow: `0 2px 8px ${event.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      }}
                    >
                      <div className="px-1.5 sm:px-2 py-0.5 sm:py-1">
                        <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow leading-tight line-clamp-1">
                          {event.title}
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-semibold text-white/80 drop-shadow mt-0.5 hidden sm:block">
                          {new Date(event.start).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground px-1.5 sm:px-2 py-0.5 sm:py-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>

                {today && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-shimmer pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

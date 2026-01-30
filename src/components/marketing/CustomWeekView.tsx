import { useMemo } from "react";

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  person: string;
  color: string;
}

interface CustomWeekViewProps {
  events: Event[];
  selectedDate: Date;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CustomWeekView({ events, selectedDate }: CustomWeekViewProps) {
  const weekStart = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStart]);

  const timeRange = useMemo(() => {
    if (events.length === 0) {
      return { start: 8, end: 20 };
    }

    let minHour = 24;
    let maxHour = 0;

    events.forEach((event) => {
      const startHour = event.start.getHours() + event.start.getMinutes() / 60;
      const endHour = event.end.getHours() + event.end.getMinutes() / 60;
      minHour = Math.min(minHour, startHour);
      maxHour = Math.max(maxHour, endHour);
    });

    minHour = Math.max(0, Math.floor(minHour) - 1);
    maxHour = Math.min(24, Math.ceil(maxHour) + 1);

    return { start: minHour, end: maxHour };
  }, [events]);

  const hours = useMemo(() => {
    const hourList: number[] = [];
    for (let h = timeRange.start; h <= timeRange.end; h++) {
      hourList.push(h);
    }
    return hourList;
  }, [timeRange]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
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

  const getEventPosition = (event: Event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;

    const rangeStartMinutes = timeRange.start * 60;
    const top = ((startMinutes - rangeStartMinutes) / 60) * 60;
    const height = (duration / 60) * 60;

    return { top: `${top}px`, height: `${Math.max(height, 32)}px` };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalHeight = (timeRange.end - timeRange.start) * 60;

  return (
    <div className="relative h-full w-full flex flex-col custom-week-view">
      
      <div className="border-b border-primary/20 sticky top-0 z-20 bg-background/95 backdrop-blur-xl">
        <div className="grid grid-cols-7 overflow-x-auto">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={index}
                className={`relative px-2 sm:px-4 py-2 sm:py-4 transition-all duration-300 min-w-[60px] sm:min-w-0 ${
                  today ? "bg-gradient-to-br from-primary/20 via-primary/15 to-secondary/10 rounded-t-2xl" : ""
                }`}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                  <span
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                      today ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {DAYS[day.getDay()]}
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black ${
                      today ? "text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]" : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 sm:gap-1 mt-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: event.color }} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                {today && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-shimmer rounded-t-2xl pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      
      <div className="flex-1 overflow-auto overflow-x-auto">
        <div className="flex relative" style={{ minHeight: `${totalHeight}px` }}>
          
          <div className="w-12 sm:w-16 flex-shrink-0 sticky left-0 bg-background/95 backdrop-blur-xl z-10 border-r border-primary/20">
            <div className="pt-2">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] flex items-start justify-end pr-2 sm:pr-3 text-[9px] sm:text-[10px] font-bold text-muted-foreground"
                >
                  {hour === 0 ? "12A" : hour < 12 ? `${hour}A` : hour === 12 ? "12P" : `${hour - 12}P`}
                </div>
              ))}
            </div>
          </div>

          
          <div
            className="flex-1 grid grid-cols-7 relative"
            style={{ minHeight: `${totalHeight}px`, minWidth: "700px" }}
          >
            
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-primary/10"
                style={{ top: `${(hour - timeRange.start) * 60}px` }}
              />
            ))}

            
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);

              return (
                <div key={dayIndex} className="relative border-r border-primary/10 last:border-r-0 min-w-[100px]">
                  
                  {dayEvents.map((event) => {
                    const position = getEventPosition(event);

                    return (
                      <div
                        key={event.id}
                        className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-2xl hover:shadow-primary/30 cursor-pointer group"
                        style={{
                          ...position,
                          backgroundColor: `${event.color}dd`,
                          boxShadow: `0 4px 16px ${event.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                        }}
                      >
                        <div className="p-1 sm:p-1.5 h-full flex flex-col justify-between">
                          <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-lg leading-tight">
                            {formatTime(new Date(event.start))}
                          </div>
                          <div className="text-[10px] sm:text-xs font-black text-white drop-shadow-lg line-clamp-1 sm:line-clamp-2 leading-tight">
                            {event.title}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-semibold text-white/80 drop-shadow leading-tight hidden sm:block">
                            {formatTime(new Date(event.end))}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

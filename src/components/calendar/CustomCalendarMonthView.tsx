import { useMemo } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import type { EventWithParticipantsDTO } from "../../types";
import { eventSpansDay, isMultiDayEvent } from "../../lib/calendar/eventUtils";
import "../../components/marketing/MarketingCalendar.css";

interface CustomCalendarMonthViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
  onSelectEvent?: (event: EventWithParticipantsDTO) => void;
  onSelectSlot?: (start: Date) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getEventColor(event: EventWithParticipantsDTO): string {
  if (event.has_conflict) {
    return "#ef4444";
  }
  if (event.event_type === "blocker") {
    return "#3b82f6";
  }
  if (event.participants && event.participants.length > 0) {
    const participant = event.participants[0];
    const colors = ["#8b5cf6", "#06b6d4", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
    const hash = participant.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  return "#6b7280";
}

export function CustomCalendarMonthView({
  events,
  isLoading,
  onSelectEvent,
  onSelectSlot,
}: CustomCalendarMonthViewProps) {
  const { state, setCurrentDate, setView } = useCalendar();

  const monthStart = useMemo(() => {
    const date = new Date(state.currentDate);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [state.currentDate]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const startDate = new Date(monthStart);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

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
    return date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear();
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => eventSpansDay(event, day));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handleEventClick = (event: EventWithParticipantsDTO) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="month-view" className="relative h-full w-full flex flex-col custom-month-view">
      {/* Month header */}
      <div className="sticky top-0 z-30 border-b border-primary/20 bg-background/95 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-4">
        <h2 className="text-xl sm:text-3xl font-black text-foreground">{formatMonthYear(monthStart)}</h2>
      </div>

      {/* Day names header */}
      <div className="border-b border-primary/20 bg-background/95 backdrop-blur-xl sticky top-[57px] sm:top-[73px] z-20">
        <div className="grid grid-cols-7">
          {DAYS.map((dayName, index) => (
            <div key={index} className="px-2 sm:px-4 py-2 sm:py-3 text-center">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {dayName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto relative">
        <div className="grid grid-cols-7" style={{ gridTemplateRows: "repeat(6, minmax(100px, 1fr))" }}>
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);
            const currentMonth = isCurrentMonth(day);

            // Filter out multi-day events - they'll be rendered separately
            const singleDayEvents = dayEvents.filter((e) => !isMultiDayEvent(e));

            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onSelectSlot) {
                    const slotDate = new Date(day);
                    slotDate.setHours(9, 0, 0, 0);
                    onSelectSlot(slotDate);
                    setCurrentDate(day);
                    setView("day");
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && onSelectSlot) {
                    e.preventDefault();
                    const slotDate = new Date(day);
                    slotDate.setHours(9, 0, 0, 0);
                    onSelectSlot(slotDate);
                    setCurrentDate(day);
                    setView("day");
                  }
                }}
                className={`relative border-r border-b border-primary/10 p-1.5 sm:p-3 transition-all duration-300 cursor-pointer overflow-visible ${
                  !currentMonth ? "opacity-40" : ""
                } ${today ? "bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/5" : "hover:bg-card/20"}`}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1 sm:mb-1.5 px-1 min-h-[20px]">
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

                {/* Single-day events */}
                <div className="space-y-0.5 sm:space-y-1 relative z-10 mt-0.5">
                  {singleDayEvents.slice(0, 2).map((event) => {
                    const color = getEventColor(event);
                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEventClick(event);
                          }
                        }}
                        className="rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.05] hover:z-50 hover:shadow-lg cursor-pointer group overflow-hidden"
                        style={{
                          backgroundColor: `${color}dd`,
                          boxShadow: `0 2px 8px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                          opacity: event.is_synced ? 0.85 : 1,
                        }}
                      >
                        <div className="px-1.5 sm:px-2 py-0.5 sm:py-1">
                          <div className="flex items-center gap-1">
                            <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow leading-tight line-clamp-1 flex-1">
                              {event.title}
                            </div>
                            {event.has_conflict && (
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/90 flex-shrink-0" />
                            )}
                            {event.is_synced && (
                              <div className="text-[8px] sm:text-[9px] text-white/70 flex-shrink-0">🔗</div>
                            )}
                          </div>
                          {!event.is_all_day && (
                            <div className="text-[8px] sm:text-[9px] font-semibold text-white/80 drop-shadow mt-0.5 hidden sm:block">
                              {new Date(event.start_time).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                  {singleDayEvents.length > 2 && (
                    <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground px-1.5 sm:px-2 py-0.5 sm:py-1">
                      +{singleDayEvents.length - 2} more
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

        {/* Multi-day events layer - render as horizontal bars per row */}
        {Array.from({ length: 6 }, (_, rowIndex) => {
          const rowStartIndex = rowIndex * 7;
          const rowDays = calendarDays.slice(rowStartIndex, rowStartIndex + 7);

          // Find the maximum number of single-day events in any cell of this row
          const maxSingleDayEvents = Math.max(
            ...rowDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              return dayEvents.filter((e) => !isMultiDayEvent(e)).length;
            })
          );

          // Get all multi-day events for this row
          const multiDayEventsInRow = events.filter((e) => {
            if (!isMultiDayEvent(e)) return false;
            const eventStart = new Date(e.start_time);
            const eventEnd = new Date(e.end_time);
            const eventStartDate = new Date(eventStart);
            eventStartDate.setHours(0, 0, 0, 0);
            const eventEndDate = new Date(eventEnd);
            eventEndDate.setHours(23, 59, 59, 999);

            return rowDays.some((day) => {
              const dayStart = new Date(day);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(day);
              dayEnd.setHours(23, 59, 59, 999);
              return eventStartDate <= dayEnd && eventEndDate >= dayStart;
            });
          });

          return (
            <div
              key={`row-${rowIndex}`}
              className="absolute pointer-events-none z-5"
              style={{
                top: `${(rowIndex / 6) * 100}%`,
                left: "0",
                width: "100%",
                height: `${(1 / 6) * 100}%`,
              }}
            >
              {multiDayEventsInRow.map((event, eventIndex) => {
                const eventStart = new Date(event.start_time);
                const eventEnd = new Date(event.end_time);
                const eventStartDate = new Date(eventStart);
                eventStartDate.setHours(0, 0, 0, 0);
                const eventEndDate = new Date(eventEnd);
                eventEndDate.setHours(23, 59, 59, 999);

                // Find which days in this row the event spans
                let rowStartCol = -1;
                let rowEndCol = -1;

                rowDays.forEach((day, colIndex) => {
                  const dayStart = new Date(day);
                  dayStart.setHours(0, 0, 0, 0);
                  const dayEnd = new Date(day);
                  dayEnd.setHours(23, 59, 59, 999);

                  if (eventStartDate <= dayEnd && eventEndDate >= dayStart) {
                    if (rowStartCol === -1) {
                      rowStartCol = colIndex;
                    }
                    rowEndCol = colIndex;
                  }
                });

                if (rowStartCol === -1 || rowEndCol === -1) return null;

                const leftPercent = (rowStartCol / 7) * 100;
                const widthPercent = ((rowEndCol - rowStartCol + 1) / 7) * 100;
                const color = getEventColor(event);

                // Check if this is the first day of the event (for showing title)
                const globalStartIndex = rowStartIndex + rowStartCol;
                const isFirstDay = globalStartIndex === 0 || !eventSpansDay(event, calendarDays[globalStartIndex - 1]);

                // Calculate top position: below date (24px) + single-day events (maxSingleDayEvents * 24px) + previous multi-day events
                const topOffset = 24 + maxSingleDayEvents * 24 + eventIndex * 22;

                return (
                  <div
                    key={`${event.id}-row-${rowIndex}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleEventClick(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleEventClick(event);
                      }
                    }}
                    className="absolute rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-lg cursor-pointer group overflow-hidden pointer-events-auto"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: `${topOffset}px`,
                      height: "20px",
                      backgroundColor: `${color}dd`,
                      boxShadow: `0 2px 8px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      opacity: event.is_synced ? 0.85 : 1,
                      marginLeft: "0.375rem",
                      marginRight: "0.375rem",
                    }}
                  >
                    {isFirstDay && (
                      <div className="px-1.5 sm:px-2 py-0.5 h-full flex items-center">
                        <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow line-clamp-1">
                          {event.title}
                        </div>
                        {event.has_conflict && (
                          <div className="ml-1 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/90 flex-shrink-0" />
                        )}
                        {event.is_synced && (
                          <div className="ml-1 text-[8px] sm:text-[9px] text-white/70 flex-shrink-0">🔗</div>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

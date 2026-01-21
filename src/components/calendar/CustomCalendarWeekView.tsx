import { useMemo } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import type { EventWithParticipantsDTO } from "../../types";
import { eventSpansDay, isMultiDayEvent } from "../../lib/calendar/eventUtils";
import "../../components/marketing/MarketingCalendar.css";

interface CustomCalendarWeekViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
  onSelectEvent?: (event: EventWithParticipantsDTO) => void;
  onSelectSlot?: (start: Date) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getEventColor(event: EventWithParticipantsDTO): string {
  if (event.has_conflict) {
    return "#ef4444"; // Red for conflicts
  }
  if (event.event_type === "blocker") {
    return "#3b82f6"; // Blue for blockers
  }
  // Elastic events - use first participant's color or default
  if (event.participants && event.participants.length > 0) {
    const participant = event.participants[0];
    const colors = ["#8b5cf6", "#06b6d4", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
    const hash = participant.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  return "#6b7280"; // Default gray
}

export function CustomCalendarWeekView({ events, isLoading, onSelectEvent, onSelectSlot }: CustomCalendarWeekViewProps) {
  const { state, setCurrentDate, setView } = useCalendar();

  const weekStart = useMemo(() => {
    const date = new Date(state.currentDate);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [state.currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStart]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => eventSpansDay(event, day));
  };

  const getEventPosition = (event: EventWithParticipantsDTO) => {
    if (event.is_all_day) {
      return { top: "0px", height: "32px" };
    }
    
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    const top = (startMinutes / 60) * 60; // 60px per hour
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
    <div data-testid="week-view" className="relative h-full w-full flex flex-col custom-week-view">
      {/* Day headers */}
      <div className="border-b border-primary/20 sticky top-0 z-20 bg-background/95 backdrop-blur-xl">
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);
            
            return (
              <div
                key={index}
                onClick={() => {
                  setCurrentDate(day);
                  setView("day");
                }}
                className={`relative px-2 sm:px-4 py-2 sm:py-4 transition-all duration-300 min-w-[60px] sm:min-w-0 cursor-pointer ${
                  today
                    ? "bg-gradient-to-br from-primary/20 via-primary/15 to-secondary/10 rounded-t-2xl"
                    : "hover:bg-card/20"
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
                      today
                        ? "text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                        : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 sm:gap-1 mt-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: getEventColor(event) }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
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

      {/* Calendar grid - Full 24 hours */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ minHeight: `${24 * 60}px` }}>
          {/* Time axis */}
          <div className="w-12 sm:w-16 flex-shrink-0 sticky left-0 bg-background/95 backdrop-blur-xl z-10 border-r border-primary/20">
            <div className="pt-2">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] flex items-start justify-end pr-2 sm:pr-3 text-[9px] sm:text-[10px] font-bold text-muted-foreground"
                >
                  {hour === 0
                    ? "12A"
                    : hour < 12
                    ? `${hour}A`
                    : hour === 12
                    ? "12P"
                    : `${hour - 12}P`}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7 relative overflow-x-auto" style={{ minHeight: `${24 * 60}px`, minWidth: "700px" }}>
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-primary/10"
                style={{ top: `${hour * 60}px` }}
              />
            ))}

            {/* Day columns structure */}
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="relative border-r border-primary/10 last:border-r-0 min-w-[100px]"
              >
                {/* Clickable time slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => {
                      if (onSelectSlot) {
                        const slotDate = new Date(day);
                        slotDate.setHours(hour, 0, 0, 0);
                        onSelectSlot(slotDate);
                      }
                    }}
                    className="absolute left-0 right-0 cursor-pointer hover:bg-primary/5 transition-colors"
                    style={{ top: `${hour * 60 + 32}px`, height: "60px" }}
                  />
                ))}
              </div>
            ))}

            {/* Multi-day all-day events layer */}
            <div className="absolute top-0 left-0 right-0 h-8 border-b border-primary/10 pointer-events-none">
              {events
                .filter((e) => e.is_all_day && isMultiDayEvent(e))
                .map((event) => {
                  const eventStart = new Date(event.start_time);
                  const eventEnd = new Date(event.end_time);
                  
                  // Find start and end day indices in the week
                  let startDayIndex = -1;
                  let endDayIndex = -1;

                  weekDays.forEach((weekDay, idx) => {
                    const weekDayStart = new Date(weekDay);
                    weekDayStart.setHours(0, 0, 0, 0);
                    const weekDayEnd = new Date(weekDay);
                    weekDayEnd.setHours(23, 59, 59, 999);

                    const eventStartDate = new Date(eventStart);
                    eventStartDate.setHours(0, 0, 0, 0);
                    const eventEndDate = new Date(eventEnd);
                    eventEndDate.setHours(23, 59, 59, 999);

                    if (eventStartDate <= weekDayEnd && eventStartDate >= weekDayStart && startDayIndex === -1) {
                      startDayIndex = idx;
                    }
                    if (eventEndDate >= weekDayStart && eventEndDate <= weekDayEnd && endDayIndex === -1) {
                      endDayIndex = idx;
                    }
                  });

                  if (eventStart < weekDays[0]) startDayIndex = 0;
                  if (eventEnd > weekDays[6]) endDayIndex = 6;

                  if (startDayIndex === -1 || endDayIndex === -1) return null;

                  const leftPercent = (startDayIndex / 7) * 100;
                  const widthPercent = ((endDayIndex - startDayIndex + 1) / 7) * 100;
                  const color = getEventColor(event);

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="absolute top-0.5 rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-lg cursor-pointer group pointer-events-auto"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        height: "28px",
                        backgroundColor: `${color}dd`,
                        boxShadow: `0 2px 8px ${color}40`,
                      }}
                    >
                      <div className="px-2 py-1 h-full flex items-center">
                        <div className="text-[10px] font-bold text-white drop-shadow line-clamp-1">
                          {event.title}
                        </div>
                        {event.has_conflict && (
                          <div className="ml-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Single-day all-day events */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              const singleDayAllDayEvents = dayEvents.filter(
                (e) => e.is_all_day && !isMultiDayEvent(e)
              );

              return (
                <div
                  key={`allday-${dayIndex}`}
                  className="absolute top-0 border-b border-primary/10 pointer-events-none"
                  style={{
                    left: `${(dayIndex / 7) * 100}%`,
                    width: `${(1 / 7) * 100}%`,
                    height: "32px",
                  }}
                >
                  {singleDayAllDayEvents.map((event, eventIdx) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="absolute left-0.5 right-0.5 top-0.5 h-7 rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-lg cursor-pointer group pointer-events-auto"
                      style={{
                        backgroundColor: `${getEventColor(event)}dd`,
                        boxShadow: `0 2px 8px ${getEventColor(event)}40`,
                        top: `${eventIdx * 32}px`,
                      }}
                    >
                      <div className="px-2 py-1 h-full flex items-center">
                        <div className="text-[10px] font-bold text-white drop-shadow line-clamp-1">
                          {event.title}
                        </div>
                        {event.has_conflict && (
                          <div className="ml-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Multi-day timed events */}
            {events
              .filter((e) => !e.is_all_day && isMultiDayEvent(e))
              .map((event) => {
                const eventStart = new Date(event.start_time);
                const eventEnd = new Date(event.end_time);
                
                let startDayIndex = -1;
                let endDayIndex = -1;

                weekDays.forEach((weekDay, idx) => {
                  const weekDayStart = new Date(weekDay);
                  weekDayStart.setHours(0, 0, 0, 0);
                  const weekDayEnd = new Date(weekDay);
                  weekDayEnd.setHours(23, 59, 59, 999);

                  if (eventStart <= weekDayEnd && eventStart >= weekDayStart && startDayIndex === -1) {
                    startDayIndex = idx;
                  }
                  if (eventEnd >= weekDayStart && eventEnd <= weekDayEnd && endDayIndex === -1) {
                    endDayIndex = idx;
                  }
                });

                if (eventStart < weekDays[0]) startDayIndex = 0;
                if (eventEnd > weekDays[6]) endDayIndex = 6;

                if (startDayIndex === -1 || endDayIndex === -1) return null;

                const leftPercent = (startDayIndex / 7) * 100;
                const widthPercent = ((endDayIndex - startDayIndex + 1) / 7) * 100;
                const position = getEventPosition(event);
                const color = getEventColor(event);

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="absolute rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-2xl hover:shadow-primary/30 cursor-pointer group"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: `${parseFloat(position.top) + 32}px`,
                      height: position.height,
                      backgroundColor: `${color}dd`,
                      boxShadow: `0 4px 16px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      opacity: event.is_synced ? 0.85 : 1,
                    }}
                  >
                    <div className="p-1 sm:p-1.5 h-full flex flex-col justify-between">
                      <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-lg leading-tight">
                        {formatTime(eventStart)}
                      </div>
                      <div className="text-[10px] sm:text-xs font-black text-white drop-shadow-lg line-clamp-1 sm:line-clamp-2 leading-tight">
                        {event.title}
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-semibold text-white/80 drop-shadow leading-tight hidden sm:block">
                        {formatTime(eventEnd)}
                      </div>
                      {event.has_conflict && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/90 shadow-lg" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}

            {/* Single-day timed events */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              const singleDayTimedEvents = dayEvents.filter(
                (e) => !e.is_all_day && !isMultiDayEvent(e)
              );

              return (
                <div
                  key={`timed-${dayIndex}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(dayIndex / 7) * 100}%`,
                    width: `${(1 / 7) * 100}%`,
                    top: "32px",
                    bottom: "0",
                  }}
                >
                  {singleDayTimedEvents.map((event) => {
                    const position = getEventPosition(event);
                    const color = getEventColor(event);
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-2xl hover:shadow-primary/30 cursor-pointer group pointer-events-auto"
                        style={{
                          ...position,
                          backgroundColor: `${color}dd`,
                          boxShadow: `0 4px 16px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                          opacity: event.is_synced ? 0.85 : 1,
                        }}
                      >
                        <div className="p-1 sm:p-1.5 h-full flex flex-col justify-between">
                          <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-lg leading-tight">
                            {formatTime(new Date(event.start_time))}
                          </div>
                          <div className="text-[10px] sm:text-xs font-black text-white drop-shadow-lg line-clamp-1 sm:line-clamp-2 leading-tight">
                            {event.title}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-semibold text-white/80 drop-shadow leading-tight hidden sm:block">
                            {formatTime(new Date(event.end_time))}
                          </div>
                          {event.has_conflict && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/90 shadow-lg" />
                          )}
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

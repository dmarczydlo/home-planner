import { useMemo } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import type { EventWithParticipantsDTO } from "../../types";
import { eventSpansDay } from "../../lib/calendar/eventUtils";
import "../../components/marketing/MarketingCalendar.css";

interface CustomCalendarDayViewProps {
  events: EventWithParticipantsDTO[];
  isLoading: boolean;
  onSelectEvent?: (event: EventWithParticipantsDTO) => void;
  onSelectSlot?: (start: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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

export function CustomCalendarDayView({ events, isLoading, onSelectEvent }: CustomCalendarDayViewProps) {
  const { state } = useCalendar();

  const dayEvents = useMemo(() => {
    return events.filter((event) => eventSpansDay(event, state.currentDate));
  }, [events, state.currentDate]);

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      state.currentDate.getDate() === today.getDate() &&
      state.currentDate.getMonth() === today.getMonth() &&
      state.currentDate.getFullYear() === today.getFullYear()
    );
  }, [state.currentDate]);

  const getEventPosition = (event: EventWithParticipantsDTO) => {
    if (event.is_all_day) {
      return { top: "0px", height: "40px" };
    }

    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    const dayStart = new Date(state.currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(state.currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const start = eventStart < dayStart ? dayStart : eventStart;
    const end = eventEnd > dayEnd ? dayEnd : eventEnd;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;

    const top = (startMinutes / 60) * 60;
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
    <div data-testid="day-view" className="relative h-full w-full flex flex-col custom-day-view">
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
              {formatDate(state.currentDate)}
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

      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ minHeight: `${24 * 60}px` }}>
          <div className="w-14 sm:w-20 flex-shrink-0 sticky left-0 bg-background/95 backdrop-blur-xl z-20 border-r border-primary/20">
            <div className="pt-2">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] flex items-start justify-end pr-2 sm:pr-4 text-[10px] sm:text-xs font-bold text-muted-foreground"
                >
                  {hour === 0 ? "12A" : hour < 12 ? `${hour}A` : hour === 12 ? "12P" : `${hour - 12}P`}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 relative" style={{ minHeight: `${24 * 60}px` }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-primary/10"
                style={{ top: `${hour * 60}px` }}
              />
            ))}

            {isToday &&
              (() => {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const top = (currentMinutes / 60) * 60;

                return (
                  <div className="absolute left-0 right-0 z-10" style={{ top: `${top}px` }}>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 border-2 border-background" />
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-secondary to-transparent" />
                    </div>
                  </div>
                );
              })()}

            <div className="absolute top-0 left-0 right-0 h-10 border-b border-primary/20 bg-background/50 backdrop-blur-sm z-5">
              {dayEvents
                .filter((e) => e.is_all_day)
                .map((event) => (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleEventClick(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleEventClick(event);
                      }
                    }}
                    className="absolute left-2 right-2 top-1 h-8 rounded-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-lg cursor-pointer group"
                    style={{
                      backgroundColor: `${getEventColor(event)}dd`,
                      boxShadow: `0 2px 8px ${getEventColor(event)}40`,
                    }}
                  >
                    <div className="px-3 py-1.5 h-full flex items-center gap-2">
                      <div className="text-xs font-bold text-white drop-shadow">{event.title}</div>
                      {event.has_conflict && <div className="w-2 h-2 rounded-full bg-white/90 shadow-lg" />}
                      {event.is_synced && <div className="text-[10px] text-white/70">🔗</div>}
                    </div>
                  </div>
                ))}
            </div>

            {HOURS.map((hour) => (
              <div
                key={hour}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onSelectSlot) {
                    const slotDate = new Date(state.currentDate);
                    slotDate.setHours(hour, 0, 0, 0);
                    onSelectSlot(slotDate);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && onSelectSlot) {
                    e.preventDefault();
                    const slotDate = new Date(state.currentDate);
                    slotDate.setHours(hour, 0, 0, 0);
                    onSelectSlot(slotDate);
                  }
                }}
                className="absolute left-0 right-0 cursor-pointer hover:bg-primary/5 transition-colors z-0"
                style={{ top: `${hour * 60 + 40}px`, height: "60px" }}
              />
            ))}

            <div className="relative px-2 sm:px-4 h-full" style={{ paddingTop: "40px" }}>
              {dayEvents
                .filter((e) => !e.is_all_day)
                .map((event) => {
                  const position = getEventPosition(event);
                  const color = getEventColor(event);

                  return (
                    <div
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleEventClick(event)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleEventClick(event);
                        }
                      }}
                      className="absolute left-2 sm:left-4 right-2 sm:right-4 rounded-xl border border-white/25 backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] hover:z-50 hover:shadow-2xl hover:shadow-primary/40 cursor-pointer group"
                      style={{
                        ...position,
                        backgroundColor: `${color}ee`,
                        boxShadow: `0 8px 24px ${color}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        opacity: event.is_synced ? 0.85 : 1,
                      }}
                    >
                      <div className="p-2 sm:p-3 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="text-[10px] sm:text-xs font-bold text-white/90 drop-shadow-lg">
                            {formatTime(new Date(event.start_time))}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {event.has_conflict && <div className="w-2 h-2 rounded-full bg-white/90 shadow-lg" />}
                            {event.is_synced && <div className="text-[10px] text-white/70">🔗</div>}
                            <div className="text-[10px] sm:text-xs font-bold text-white/70 drop-shadow">
                              {formatTime(new Date(event.end_time))}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm sm:text-base font-black text-white drop-shadow-lg mt-0.5 sm:mt-1">
                          {event.title}
                        </div>
                        {event.participants && event.participants.length > 0 && (
                          <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {event.participants.slice(0, 3).map((participant, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <div
                                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                                  style={{ backgroundColor: getEventColor(event) }}
                                />
                                <span className="text-[9px] sm:text-xs font-semibold text-white/80 drop-shadow">
                                  {participant.name}
                                </span>
                              </div>
                            ))}
                            {event.participants.length > 3 && (
                              <span className="text-[9px] sm:text-xs text-white/60">
                                +{event.participants.length - 3}
                              </span>
                            )}
                          </div>
                        )}
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

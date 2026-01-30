import type { EventWithParticipantsDTO } from "../../types";

export function eventsOverlap(event1: EventWithParticipantsDTO, event2: EventWithParticipantsDTO): boolean {
  const start1 = new Date(event1.start_time).getTime();
  const end1 = new Date(event1.end_time).getTime();
  const start2 = new Date(event2.start_time).getTime();
  const end2 = new Date(event2.end_time).getTime();

  return start1 < end2 && start2 < end1;
}

export function getConflictingEvents(
  event: EventWithParticipantsDTO,
  allEvents: EventWithParticipantsDTO[]
): EventWithParticipantsDTO[] {
  return allEvents.filter((otherEvent) => {
    if (otherEvent.id === event.id) return false;

    if (otherEvent.event_type !== "blocker") return false;

    if (!eventsOverlap(event, otherEvent)) return false;

    const eventParticipantIds = event.participants.map((p) => p.id);
    const otherParticipantIds = otherEvent.participants.map((p) => p.id);

    return eventParticipantIds.some((id) => otherParticipantIds.includes(id));
  });
}

export function getEventDuration(event: EventWithParticipantsDTO): number {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  return Math.floor((end - start) / (1000 * 60));
}

export function sortEventsByStartTime(events: EventWithParticipantsDTO[]): EventWithParticipantsDTO[] {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return timeA - timeB;
  });
}

export function filterEventsByType(
  events: EventWithParticipantsDTO[],
  type: "elastic" | "blocker"
): EventWithParticipantsDTO[] {
  return events.filter((event) => event.event_type === type);
}

export function filterEventsByParticipant(
  events: EventWithParticipantsDTO[],
  participantId: string
): EventWithParticipantsDTO[] {
  return events.filter((event) => event.participants.some((p) => p.id === participantId));
}

export function isEventInPast(event: EventWithParticipantsDTO): boolean {
  const now = new Date().getTime();
  const eventEnd = new Date(event.end_time).getTime();
  return eventEnd < now;
}

export function isEventHappening(event: EventWithParticipantsDTO): boolean {
  const now = new Date().getTime();
  const eventStart = new Date(event.start_time).getTime();
  const eventEnd = new Date(event.end_time).getTime();
  return eventStart <= now && now <= eventEnd;
}

export function eventSpansDay(event: EventWithParticipantsDTO, day: Date): boolean {
  const eventStart = new Date(event.start_time);
  const eventEnd = new Date(event.end_time);

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  if (event.is_all_day) {
    const eventStartDate = new Date(eventStart);
    eventStartDate.setHours(0, 0, 0, 0);

    const eventEndDate = new Date(eventEnd);
    eventEndDate.setHours(23, 59, 59, 999);

    return eventStartDate <= dayEnd && eventEndDate >= dayStart;
  }

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

export function isMultiDayEvent(event: EventWithParticipantsDTO): boolean {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return startDate.getTime() !== endDate.getTime();
}

export function getEventDaySpan(event: EventWithParticipantsDTO): number {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays + 1);
}

export function eventStartsOnDay(event: EventWithParticipantsDTO, day: Date): boolean {
  const eventStart = new Date(event.start_time);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return eventStart >= dayStart && eventStart <= dayEnd;
}

export function eventEndsOnDay(event: EventWithParticipantsDTO, day: Date): boolean {
  const eventEnd = new Date(event.end_time);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return eventEnd >= dayStart && eventEnd <= dayEnd;
}

export function getEventColor(event: EventWithParticipantsDTO): {
  bg: string;
  border: string;
  text: string;
} {
  if (event.has_conflict) {
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-500 dark:border-red-400",
      text: "text-red-900 dark:text-red-100",
    };
  }

  if (event.event_type === "blocker") {
    return {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-500 dark:border-blue-400",
      text: "text-blue-900 dark:text-blue-100",
    };
  }

  return {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-300 dark:border-gray-600",
    text: "text-gray-900 dark:text-gray-100",
  };
}

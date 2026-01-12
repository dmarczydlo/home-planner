import type { EventWithParticipantsDTO } from "../../types";

/**
 * Check if two events overlap in time
 */
export function eventsOverlap(
  event1: EventWithParticipantsDTO,
  event2: EventWithParticipantsDTO
): boolean {
  const start1 = new Date(event1.start_time).getTime();
  const end1 = new Date(event1.end_time).getTime();
  const start2 = new Date(event2.start_time).getTime();
  const end2 = new Date(event2.end_time).getTime();

  return start1 < end2 && start2 < end1;
}

/**
 * Get events that conflict with a given event
 */
export function getConflictingEvents(
  event: EventWithParticipantsDTO,
  allEvents: EventWithParticipantsDTO[]
): EventWithParticipantsDTO[] {
  return allEvents.filter((otherEvent) => {
    if (otherEvent.id === event.id) return false;
    
    // Only check blocker events for conflicts
    if (otherEvent.event_type !== "blocker") return false;
    
    // Check if events overlap in time
    if (!eventsOverlap(event, otherEvent)) return false;
    
    // Check if they share any participants
    const eventParticipantIds = event.participants.map((p) => p.id);
    const otherParticipantIds = otherEvent.participants.map((p) => p.id);
    
    return eventParticipantIds.some((id) => otherParticipantIds.includes(id));
  });
}

/**
 * Calculate event duration in minutes
 */
export function getEventDuration(event: EventWithParticipantsDTO): number {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  return Math.floor((end - start) / (1000 * 60));
}

/**
 * Sort events by start time
 */
export function sortEventsByStartTime(
  events: EventWithParticipantsDTO[]
): EventWithParticipantsDTO[] {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return timeA - timeB;
  });
}

/**
 * Filter events by type
 */
export function filterEventsByType(
  events: EventWithParticipantsDTO[],
  type: "elastic" | "blocker"
): EventWithParticipantsDTO[] {
  return events.filter((event) => event.event_type === type);
}

/**
 * Filter events by participant
 */
export function filterEventsByParticipant(
  events: EventWithParticipantsDTO[],
  participantId: string
): EventWithParticipantsDTO[] {
  return events.filter((event) =>
    event.participants.some((p) => p.id === participantId)
  );
}

/**
 * Check if event is in the past
 */
export function isEventInPast(event: EventWithParticipantsDTO): boolean {
  const now = new Date().getTime();
  const eventEnd = new Date(event.end_time).getTime();
  return eventEnd < now;
}

/**
 * Check if event is currently happening
 */
export function isEventHappening(event: EventWithParticipantsDTO): boolean {
  const now = new Date().getTime();
  const eventStart = new Date(event.start_time).getTime();
  const eventEnd = new Date(event.end_time).getTime();
  return eventStart <= now && now <= eventEnd;
}

/**
 * Get event color based on type and status
 */
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

import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { ParticipantSelector } from "./ParticipantSelector";
import { ConflictWarning } from "./ConflictWarning";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { EventWithParticipantsDTO, ConflictingEventDTO } from "../../types";

interface EventEditModalProps {
  event: EventWithParticipantsDTO | null;
  familyId: string;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

export function EventEditModal({
  event,
  familyId,
  isOpen,
  onClose,
  onEventUpdated,
  onEventDeleted,
}: EventEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictingEventDTO[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [participants, setParticipants] = useState<{ id: string; type: "user" | "child" }[]>([]);
  const [recurrence, setRecurrence] = useState<{
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    end_date: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    startTime: "",
    endTime: "",
    isAllDay: false,
    eventType: "elastic" as "elastic" | "blocker",
    scope: "all" as "this" | "future" | "all",
  });

  const convertToISOTimestamp = (dateTimeString: string, isAllDay: boolean, isEndTime = false): string => {
    if (isAllDay) {
      const date = new Date(dateTimeString);
      if (isEndTime) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date.toISOString();
    }
    const date = new Date(dateTimeString);
    return date.toISOString();
  };

  const validateEvent = useCallback(
    async (debounceMs = 500) => {
      if (formData.eventType !== "blocker" || !formData.title || !formData.startTime || !formData.endTime || !event) {
        setConflicts([]);
        return;
      }

      setIsValidating(true);
      setConflicts([]);

      await new Promise((resolve) => setTimeout(resolve, debounceMs));

      try {
        const supabase = createSupabaseClientForAuth();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          return;
        }

        const response = await fetch("/api/events/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            family_id: familyId,
            title: formData.title,
            start_time: convertToISOTimestamp(formData.startTime, formData.isAllDay, false),
            end_time: convertToISOTimestamp(formData.endTime, formData.isAllDay, true),
            is_all_day: formData.isAllDay,
            event_type: formData.eventType,
            participants: participants.length > 0 ? participants : undefined,
            exclude_event_id: event.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setConflicts(data.conflicts || []);
        }
      } catch (err) {
        console.error("Failed to validate event:", err);
      } finally {
        setIsValidating(false);
      }
    },
    [familyId, formData, participants, event]
  );
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      const isRecurring = !!event.recurrence_pattern;

      setFormData({
        title: event.title,
        startTime: event.is_all_day ? startDate.toISOString().slice(0, 10) : startDate.toISOString().slice(0, 16),
        endTime: event.is_all_day ? endDate.toISOString().slice(0, 10) : endDate.toISOString().slice(0, 16),
        isAllDay: event.is_all_day,
        eventType: event.event_type,
        scope: isRecurring ? "all" : "all",
      });

      setParticipants(
        event.participants.map((p) => ({
          id: p.id,
          type: p.type,
        }))
      );

      if (event.recurrence_pattern) {
        const startDate = new Date(event.start_time);
        const defaultEndDate = new Date(startDate);
        defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);

        setRecurrence({
          frequency: event.recurrence_pattern.frequency,
          interval: event.recurrence_pattern.interval || 1,
          end_date: event.recurrence_pattern.end_date || defaultEndDate.toISOString().slice(0, 10),
        });
      } else {
        setRecurrence(null);
      }

      setError(null);
      setShowDeleteConfirm(false);
      setConflicts([]);
    }
  }, [event]);

  useEffect(() => {
    if (formData.eventType === "blocker" && formData.title && formData.startTime && formData.endTime && event) {
      const timeoutId = setTimeout(() => {
        validateEvent();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setConflicts([]);
    }
  }, [
    formData.eventType,
    formData.title,
    formData.startTime,
    formData.endTime,
    formData.isAllDay,
    participants,
    event,
    validateEvent,
  ]);
  if (!isOpen || !event) return null;

  const canEdit = !event.is_synced;
  const canDelete = !event.is_synced;
  const hasConflicts = conflicts.length > 0 && formData.eventType === "blocker";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !event) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const isRecurring = !!event.recurrence_pattern;
      const scope = isRecurring ? formData.scope : "all";
      const occurrenceDate =
        scope === "this" && isRecurring
          ? (event as EventWithParticipantsDTO & { _occurrenceDate?: string })._occurrenceDate ||
            new Date(event.start_time).toISOString().split("T")[0]
          : undefined;

      const url = new URL(`/api/events/${event.id}`, window.location.origin);
      if (scope) {
        url.searchParams.set("scope", scope);
      }
      if (occurrenceDate) {
        url.searchParams.set("date", occurrenceDate);
      }

      const supabase = createSupabaseClientForAuth();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          start_time: convertToISOTimestamp(formData.startTime, formData.isAllDay, false),
          end_time: convertToISOTimestamp(formData.endTime, formData.isAllDay, true),
          is_all_day: formData.isAllDay,
          event_type: formData.eventType,
          participants: participants.length > 0 ? participants : undefined,
          recurrence_pattern: recurrence
            ? {
                frequency: recurrence.frequency,
                interval: recurrence.interval,
                end_date: recurrence.end_date,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }

      onEventUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete event");
      }

      onEventDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isDeleting) {
      onClose();
      setError(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit event"
    >
      <div
        className="glass-effect rounded-lg border border-primary/20 shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-modern"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex items-center justify-between p-6 border-b border-primary/20">
          <h2 className="text-xl font-semibold text-foreground">Edit Event</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isDeleting}
            className="p-2 rounded-lg hover:bg-card/60 transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!canEdit && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                This event is synced from an external calendar and cannot be edited.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
              placeholder="Enter event title"
              disabled={isSubmitting || !canEdit}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              className="w-4 h-4 text-primary border-primary/20 rounded focus:ring-primary"
              disabled={isSubmitting || !canEdit}
            />
            <label htmlFor="isAllDay" className="ml-2 text-sm font-medium text-foreground">
              All day event
            </label>
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-foreground mb-1">
              Start Time *
            </label>
            <input
              type={formData.isAllDay ? "date" : "datetime-local"}
              id="startTime"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
              disabled={isSubmitting || !canEdit}
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-foreground mb-1">
              End Time *
            </label>
            <input
              type={formData.isAllDay ? "date" : "datetime-local"}
              id="endTime"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
              disabled={isSubmitting || !canEdit}
            />
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-foreground mb-1">
              Event Type
            </label>
            <select
              id="eventType"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as "elastic" | "blocker" })}
              className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
              disabled={isSubmitting || !canEdit}
            >
              <option value="elastic">Elastic</option>
              <option value="blocker">Blocker</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Blocker events prevent scheduling conflicts, elastic events are flexible
            </p>
          </div>

          {canEdit && (
            <ParticipantSelector
              familyId={familyId}
              selectedParticipants={participants}
              onSelectionChange={setParticipants}
            />
          )}

          {canEdit && (
            <RecurrenceEditor
              value={recurrence}
              onChange={setRecurrence}
              startDate={formData.startTime || new Date().toISOString().slice(0, 10)}
            />
          )}

          {event?.recurrence_pattern && (
            <div>
              <label htmlFor="scope" className="block text-sm font-medium text-foreground mb-1">
                Update Scope
              </label>
              <select
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value as "this" | "future" | "all" })}
                className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
                disabled={isSubmitting || !canEdit}
              >
                <option value="this">This occurrence only</option>
                <option value="future">This and future occurrences</option>
                <option value="all">All occurrences</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.scope === "this" && "Only updates this specific occurrence"}
                {formData.scope === "future" && "Updates this occurrence and all future ones"}
                {formData.scope === "all" && "Updates all occurrences of this recurring event"}
              </p>
            </div>
          )}

          {canEdit && formData.eventType === "blocker" && (
            <ConflictWarning conflicts={conflicts} isValidating={isValidating} />
          )}

          <div className="flex gap-3 pt-4">
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 border border-destructive/30 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isDeleting}
              className="px-4 py-2 border border-primary/20 rounded-lg text-foreground hover:bg-card/60 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canEdit || hasConflicts}
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Event"}
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-3">Are you sure you want to delete this event?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-primary/20 rounded-lg text-foreground hover:bg-card/60 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete Event"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

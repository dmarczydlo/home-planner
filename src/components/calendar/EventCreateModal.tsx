import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useCalendar } from "../../contexts/CalendarContext";
import { ParticipantSelector } from "./ParticipantSelector";
import { ConflictWarning } from "./ConflictWarning";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { ConflictingEventDTO } from "@/types";

interface EventCreateModalProps {
  familyId: string;
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

export function EventCreateModal({ familyId, isOpen, onClose, onEventCreated }: EventCreateModalProps) {
  const { state } = useCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictingEventDTO[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [participants, setParticipants] = useState<{ id: string; type: "user" | "child" }[]>([]);
  const [recurrence, setRecurrence] = useState<{
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    end_date: string;
  } | null>(null);

  const getDefaultStartTime = () => {
    const now = new Date(state.currentDate);
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    const now = new Date(state.currentDate);
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: "",
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    isAllDay: false,
    eventType: "elastic" as "elastic" | "blocker",
  });

  const validateEvent = useCallback(
    async (debounceMs = 500) => {
      if (formData.eventType !== "blocker" || !formData.title || !formData.startTime || !formData.endTime) {
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
    [familyId, formData, participants]
  );

  useEffect(() => {
    if (formData.eventType === "blocker" && formData.title && formData.startTime && formData.endTime) {
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
    validateEvent,
  ]);

  // Reset form data when modal opens to use current date defaults
  // This ensures that opening the modal always shows defaults based on the current date,
  // even if the date changed since the component was mounted
  // Note: We intentionally only depend on isOpen to reset form when modal opens/closes
  // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime(),
        isAllDay: false,
        eventType: "elastic",
      });
      setParticipants([]);
      setRecurrence(null);
      setError(null);
      setConflicts([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const hasConflicts = conflicts.length > 0 && formData.eventType === "blocker";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseClientForAuth();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/events", {
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
        throw new Error(errorData.message || "Failed to create event");
      }

      onEventCreated?.();
      onClose();

      setFormData({
        title: "",
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime(),
        isAllDay: false,
        eventType: "elastic",
      });
      setParticipants([]);
      setRecurrence(null);
      setConflicts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError(null);
    }
  };

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
      aria-label="Create event"
    >
      <div
        className="glass-effect rounded-lg border border-primary/20 shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-modern"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex items-center justify-between p-6 border-b border-primary/20">
          <h2 className="text-xl font-semibold text-foreground">Create New Event</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-card/60 transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => {
                const isAllDay = e.target.checked;
                let newEndTime = formData.endTime;

                if (isAllDay && formData.startTime && formData.endTime) {
                  const startDate = new Date(formData.startTime);
                  const endDate = new Date(formData.endTime);
                  if (startDate.toDateString() === endDate.toDateString()) {
                    newEndTime = formData.startTime;
                  }
                }

                setFormData({ ...formData, isAllDay, endTime: newEndTime });
              }}
              className="w-4 h-4 text-primary border-primary/20 rounded focus:ring-primary"
              disabled={isSubmitting}
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
              onChange={(e) => {
                const newStartTime = e.target.value;
                let newEndTime = formData.endTime;
                if (formData.isAllDay && formData.startTime && formData.endTime) {
                  const oldStartDate = new Date(formData.startTime);
                  const oldEndDate = new Date(formData.endTime);
                  if (oldStartDate.toDateString() === oldEndDate.toDateString()) {
                    newEndTime = newStartTime;
                  }
                }
                setFormData({ ...formData, startTime: newStartTime, endTime: newEndTime });
              }}
              className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              <option value="elastic">Elastic</option>
              <option value="blocker">Blocker</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Blocker events prevent scheduling conflicts, elastic events are flexible
            </p>
          </div>

          <ParticipantSelector
            familyId={familyId}
            selectedParticipants={participants}
            onSelectionChange={setParticipants}
          />

          <RecurrenceEditor value={recurrence} onChange={setRecurrence} startDate={formData.startTime} />

          {formData.eventType === "blocker" && <ConflictWarning conflicts={conflicts} isValidating={isValidating} />}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-primary/20 rounded-lg text-foreground hover:bg-card/60 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasConflicts}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

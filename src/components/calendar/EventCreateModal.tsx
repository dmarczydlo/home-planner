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
  const [participants, setParticipants] = useState<Array<{ id: string; type: "user" | "child" }>>([]);
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
  });

  const validateEvent = useCallback(
    async (debounceMs: number = 500) => {
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
  }, [formData.eventType, formData.title, formData.startTime, formData.endTime, formData.isAllDay, participants, validateEvent]);

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
        startTime: "",
        endTime: "",
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

  const convertToISOTimestamp = (dateTimeString: string, isAllDay: boolean, isEndTime: boolean = false): string => {
    if (isAllDay) {
      const date = new Date(dateTimeString);
      if (isEndTime) {
        // For all-day events, set end time to end of day
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
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Event</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter event title"
              disabled={isSubmitting}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => {
                const isAllDay = e.target.checked;
                let newEndTime = formData.endTime;
                
                // If enabling all-day and start/end are same date, keep them the same
                if (isAllDay && formData.startTime && formData.endTime) {
                  const startDate = new Date(formData.startTime);
                  const endDate = new Date(formData.endTime);
                  if (startDate.toDateString() === endDate.toDateString()) {
                    newEndTime = formData.startTime;
                  }
                }
                
                setFormData({ ...formData, isAllDay, endTime: newEndTime });
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <label htmlFor="isAllDay" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              All day event
            </label>
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time *
            </label>
            <input
              type={formData.isAllDay ? "date" : "datetime-local"}
              id="startTime"
              required
              value={formData.startTime || getDefaultStartTime()}
              onChange={(e) => {
                const newStartTime = e.target.value;
                // If all-day and end time is same as old start time, update end time too
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time *
            </label>
            <input
              type={formData.isAllDay ? "date" : "datetime-local"}
              id="endTime"
              required
              value={formData.endTime || getDefaultEndTime()}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Type
            </label>
            <select
              id="eventType"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as "elastic" | "blocker" })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="elastic">Elastic</option>
              <option value="blocker">Blocker</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Blocker events prevent scheduling conflicts, elastic events are flexible
            </p>
          </div>

          {/* Participants */}
          <ParticipantSelector
            familyId={familyId}
            selectedParticipants={participants}
            onSelectionChange={setParticipants}
          />

          {/* Recurrence */}
          <RecurrenceEditor
            value={recurrence}
            onChange={setRecurrence}
            startDate={formData.startTime || getDefaultStartTime()}
          />

          {/* Conflict Warning */}
          {formData.eventType === "blocker" && (
            <ConflictWarning conflicts={conflicts} isValidating={isValidating} />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasConflicts}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

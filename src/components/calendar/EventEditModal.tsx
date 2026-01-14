import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import type { EventWithParticipantsDTO } from "../../types";

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

  const [formData, setFormData] = useState({
    title: "",
    startTime: "",
    endTime: "",
    isAllDay: false,
    eventType: "elastic" as "elastic" | "blocker",
    scope: "all" as "this" | "future" | "all",
  });

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      const isRecurring = !!event.recurrence_pattern;
      
      setFormData({
        title: event.title,
        startTime: event.is_all_day
          ? startDate.toISOString().slice(0, 10)
          : startDate.toISOString().slice(0, 16),
        endTime: event.is_all_day
          ? endDate.toISOString().slice(0, 10)
          : endDate.toISOString().slice(0, 16),
        isAllDay: event.is_all_day,
        eventType: event.event_type,
        scope: isRecurring ? "all" : "all",
      });
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const canEdit = !event.is_synced;
  const canDelete = !event.is_synced;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !event) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const isRecurring = !!event.recurrence_pattern;
      const scope = isRecurring ? formData.scope : "all";
      // Use the occurrence date from the clicked event, or fall back to event start_time
      const occurrenceDate = scope === "this" && isRecurring 
        ? (event as any)._occurrenceDate || new Date(event.start_time).toISOString().split("T")[0]
        : undefined;

      const url = new URL(`/api/events/${event.id}`, window.location.origin);
      if (scope) {
        url.searchParams.set("scope", scope);
      }
      if (occurrenceDate) {
        url.searchParams.set("date", occurrenceDate);
      }

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          start_time: convertToISOTimestamp(formData.startTime, formData.isAllDay, false),
          end_time: convertToISOTimestamp(formData.endTime, formData.isAllDay, true),
          is_all_day: formData.isAllDay,
          event_type: formData.eventType,
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Event</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isDeleting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!canEdit && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                This event is synced from an external calendar and cannot be edited.
              </p>
            </div>
          )}

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
              disabled={isSubmitting || !canEdit}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting || !canEdit}
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
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting || !canEdit}
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
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting || !canEdit}
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
              disabled={isSubmitting || !canEdit}
            >
              <option value="elastic">Elastic</option>
              <option value="blocker">Blocker</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Blocker events prevent scheduling conflicts, elastic events are flexible
            </p>
          </div>

          {/* Scope Selection (only for recurring events) */}
          {event?.recurrence_pattern && (
            <div>
              <label htmlFor="scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Update Scope
              </label>
              <select
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value as "this" | "future" | "all" })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting || !canEdit}
              >
                <option value="this">This occurrence only</option>
                <option value="future">This and future occurrences</option>
                <option value="all">All occurrences</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.scope === "this" && "Only updates this specific occurrence"}
                {formData.scope === "future" && "Updates this occurrence and all future ones"}
                {formData.scope === "all" && "Updates all occurrences of this recurring event"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center gap-2"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Event"}
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-3">
                Are you sure you want to delete this event?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

import { AlertTriangle } from "lucide-react";
import type { ConflictingEventDTO } from "@/types";

interface ConflictWarningProps {
  conflicts: ConflictingEventDTO[];
  isValidating?: boolean;
}

export function ConflictWarning({ conflicts, isValidating }: ConflictWarningProps) {
  if (isValidating) {
    return (
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-pulse" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Checking for conflicts...</p>
        </div>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return null;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Cannot save: This blocker event conflicts with {conflicts.length} existing event{conflicts.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Save button is disabled until conflict is resolved. Adjust the time to continue.
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="p-2 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{conflict.title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formatTime(conflict.start_time)} - {formatTime(conflict.end_time)}
            </p>
            {conflict.participants.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                With: {conflict.participants.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";
import type { ConflictingEventDTO } from "@/types";

interface ConflictWarningProps {
  conflicts: ConflictingEventDTO[];
  isValidating?: boolean;
}

export function ConflictWarning({ conflicts, isValidating }: ConflictWarningProps) {
  if (isValidating) {
    return (
      <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning animate-pulse" />
          <p className="text-sm text-warning">Checking for conflicts...</p>
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
    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive mb-1">
            Cannot save: This blocker event conflicts with {conflicts.length} existing event
            {conflicts.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-destructive/80">
            Save button is disabled until conflict is resolved. Adjust the time to continue.
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="p-2 glass-effect rounded border border-destructive/30">
            <p className="text-sm font-medium text-foreground">{conflict.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(conflict.start_time)} - {formatTime(conflict.end_time)}
            </p>
            {conflict.participants.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                With: {conflict.participants.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

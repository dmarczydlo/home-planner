import { useState } from "react";
import { Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExternalCalendars } from "@/hooks/useExternalCalendars";
import { CalendarCard } from "./CalendarCard";
import { ConnectCalendarFlow } from "./ConnectCalendarFlow";

interface ExternalCalendarsTabProps {
  familyId: string;
}

export function ExternalCalendarsTab({ familyId }: ExternalCalendarsTabProps) {
  const [showConnectFlow, setShowConnectFlow] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  
  const {
    calendars,
    isLoading,
    error,
    syncStatus,
    loadCalendars,
    syncCalendar,
    syncAllCalendars,
    disconnectCalendar,
  } = useExternalCalendars();

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await syncAllCalendars();
    } catch (err) {
      console.error("Failed to sync all calendars:", err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleConnectSuccess = () => {
    loadCalendars();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">External Calendars</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect and sync your external calendars
          </p>
        </div>
        {calendars.length > 0 && (
          <Button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {isSyncingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Syncing All...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {calendars.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-primary/30 rounded-lg glass-effect">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No calendars connected</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Connect your Google Calendar or Microsoft 365 to sync events
            </p>
            <Button onClick={() => setShowConnectFlow(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Calendar
            </Button>
          </div>
        ) : (
          <>
            {calendars.map((calendar) => (
              <CalendarCard
                key={calendar.id}
                calendar={calendar}
                syncStatus={syncStatus[calendar.id] || "idle"}
                onSync={syncCalendar}
                onDisconnect={disconnectCalendar}
              />
            ))}
            <Button
              onClick={() => setShowConnectFlow(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Another Calendar
            </Button>
          </>
        )}
      </div>

      <ConnectCalendarFlow
        open={showConnectFlow}
        onOpenChange={setShowConnectFlow}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
}

import { useState } from "react";
import { Loader2, Calendar as CalendarIcon, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ExternalCalendarSummaryDTO } from "@/types";

interface CalendarCardProps {
  calendar: ExternalCalendarSummaryDTO;
  syncStatus: "idle" | "syncing" | "success" | "error";
  onSync: (calendarId: string) => Promise<void>;
  onDisconnect: (calendarId: string) => Promise<void>;
}

export function CalendarCard({ calendar, syncStatus, onSync, onDisconnect }: CalendarCardProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleSync = async () => {
    try {
      await onSync(calendar.id);
    } catch (error) {
      console.error("Failed to sync calendar:", error);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(calendar.id);
      setShowDisconnectDialog(false);
    } catch (error) {
      console.error("Failed to disconnect calendar:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getProviderIcon = () => {
    if (calendar.provider === "google") {
      return (
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <CalendarIcon className="h-5 w-5 text-primary" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
        <CalendarIcon className="h-5 w-5 text-secondary" />
      </div>
    );
  };

  const getProviderName = () => {
    return calendar.provider === "google" ? "Google Calendar" : "Microsoft 365";
  };

  const getLastSyncedText = () => {
    if (!calendar.last_synced_at) {
      return "Never synced";
    }

    const lastSynced = new Date(calendar.last_synced_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSynced.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const getSyncStatusBadge = () => {
    if (syncStatus === "syncing") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing
        </Badge>
      );
    }

    if (syncStatus === "success") {
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Synced
        </Badge>
      );
    }

    if (calendar.sync_status === "error" || syncStatus === "error") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  const isSyncing = syncStatus === "syncing";
  const hasError = calendar.sync_status === "error" || syncStatus === "error";

  return (
    <>
      <Card className="glass-effect border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {getProviderIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{getProviderName()}</h3>
              <p className="text-sm text-muted-foreground truncate">{calendar.account_email}</p>
            </div>
            {getSyncStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p>Last synced: {getLastSyncedText()}</p>
          </div>

          {hasError && calendar.error_message && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{calendar.error_message}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSync} disabled={isSyncing} variant="outline" size="sm" className="flex-1">
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowDisconnectDialog(true)}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect {getProviderName()}? This will stop syncing events from this calendar.
              Events already imported will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

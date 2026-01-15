import { useState } from "react";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCalendarApi } from "@/hooks/useCalendarApi";
import type { CalendarProvider } from "@/types";

interface ConnectCalendarFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConnectCalendarFlow({ open, onOpenChange, onSuccess }: ConnectCalendarFlowProps) {
  const { connectCalendar, isConnecting, error } = useCalendarApi();
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);

  const handleConnect = async (provider: CalendarProvider) => {
    setSelectedProvider(provider);
    
    try {
      const result = await connectCalendar({ provider });
      
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else if (result.calendar) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Failed to connect calendar:", err);
      setSelectedProvider(null);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      setSelectedProvider(null);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[400px] sm:h-auto">
        <SheetHeader>
          <SheetTitle>Connect Calendar</SheetTitle>
          <SheetDescription>
            Select a calendar provider to sync your events
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <Button
            variant="outline"
            className="w-full h-auto py-4 justify-start"
            onClick={() => handleConnect("google")}
            disabled={isConnecting}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">Google Calendar</div>
                <div className="text-sm text-muted-foreground">
                  Connect your Google Calendar
                </div>
              </div>
              {isConnecting && selectedProvider === "google" && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-4 justify-start"
            onClick={() => handleConnect("microsoft")}
            disabled={isConnecting}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">Microsoft 365</div>
                <div className="text-sm text-muted-foreground">
                  Connect your Microsoft 365 calendar
                </div>
              </div>
              {isConnecting && selectedProvider === "microsoft" && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleClose}
            disabled={isConnecting}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

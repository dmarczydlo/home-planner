import { RefreshCw, Settings } from "lucide-react";

interface CalendarHeaderProps {
  onRefresh?: () => void;
  onSettingsClick?: () => void;
  isRefreshing?: boolean;
}

export function CalendarHeader({
  onRefresh,
  onSettingsClick,
  isRefreshing = false
}: CalendarHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2 border-border/50">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Family Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your family schedule
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl hover:bg-primary/10 active:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh calendar"
            >
              <RefreshCw
                className={`w-5 h-5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2.5 rounded-xl hover:bg-accent/10 active:bg-accent/20 transition-colors"
              aria-label="Calendar settings"
            >
              <Settings className="w-5 h-5 text-accent" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

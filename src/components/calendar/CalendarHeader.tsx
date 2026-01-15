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
  // Only render if there are action buttons, otherwise return null
  if (!onRefresh && !onSettingsClick) {
    return null;
  }

  return (
    <div className="glass-effect border-b border-primary/20 backdrop-blur-2xl">
      <div className="flex items-center justify-end px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 sm:p-2.5 rounded-xl glass-effect hover:bg-card/60 active:bg-card/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              aria-label="Refresh calendar"
            >
              <RefreshCw
                className={`w-4 h-4 sm:w-5 sm:h-5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 sm:p-2.5 rounded-xl glass-effect hover:bg-card/60 active:bg-card/80 transition-all duration-300 hover:scale-105"
              aria-label="Calendar settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

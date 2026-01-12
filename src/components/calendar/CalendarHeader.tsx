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
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        Calendar
      </h1>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            aria-label="Refresh calendar"
          >
            <RefreshCw 
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} 
            />
          </button>
        )}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Calendar settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

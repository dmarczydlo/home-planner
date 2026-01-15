import { Calendar } from "lucide-react";

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
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg blur-md opacity-40"></div>
        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          <Calendar className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Family Calendar
        </h1>
        <p className="text-xs text-muted-foreground">
          Coordinate your family schedule
        </p>
      </div>
    </div>
  );
}

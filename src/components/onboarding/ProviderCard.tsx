import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CalendarProvider } from "@/types";

interface ProviderCardProps {
  provider: CalendarProvider;
  name: string;
  description: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  isConnected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function ProviderCard({
  provider,
  name,
  description,
  icon,
  isSelected = false,
  isConnected = false,
  onClick,
  disabled = false,
}: ProviderCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all min-h-[120px]",
        "hover:border-primary hover:shadow-md",
        isSelected && "border-primary border-2",
        isConnected && "border-green-500 border-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {icon && <div className="text-2xl">{icon}</div>}
          <div className="flex-1">
            <h3 className="font-semibold text-base">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {isConnected && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


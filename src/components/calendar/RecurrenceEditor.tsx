import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  end_date: string;
}

interface RecurrenceEditorProps {
  value: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
  startDate: string;
}

export function RecurrenceEditor({ value, onChange, startDate }: RecurrenceEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDefaultEndDate = () => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + 3);
    return start.toISOString().slice(0, 10);
  };

  const handleToggle = () => {
    if (!isExpanded && !value) {
      onChange({
        frequency: "weekly",
        interval: 1,
        end_date: getDefaultEndDate(),
      });
    }
    setIsExpanded(!isExpanded);
  };

  const handleDisable = () => {
    onChange(null);
    setIsExpanded(false);
  };

  const handleFrequencyChange = (frequency: "daily" | "weekly" | "monthly") => {
    if (value) {
      onChange({ ...value, frequency });
    }
  };

  const handleIntervalChange = (interval: number) => {
    if (value && interval > 0) {
      onChange({ ...value, interval });
    }
  };

  const handleEndDateChange = (endDate: string) => {
    if (value) {
      onChange({ ...value, end_date: endDate || getDefaultEndDate() });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="block text-sm font-medium text-foreground">Recurrence</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8"
          aria-label={isExpanded ? "Collapse recurrence" : "Expand recurrence"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {!isExpanded && value && (
        <p className="text-xs text-muted-foreground">
          Repeats {value.frequency} every {value.interval}{" "}
          {value.frequency === "daily" ? "day(s)" : value.frequency === "weekly" ? "week(s)" : "month(s)"}
        </p>
      )}

      {isExpanded && (
        <div className="space-y-4 p-4 border border-primary/20 rounded-lg glass-effect">
          <div>
            <div className="block text-sm font-medium text-foreground mb-2">Frequency</div>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleFrequencyChange(freq)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    value?.frequency === freq
                      ? "bg-gradient-to-r from-primary to-secondary text-white"
                      : "bg-card text-foreground hover:bg-card/60 border border-primary/20"
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="interval" className="block text-sm font-medium text-foreground mb-1">
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="interval"
                min="1"
                max="365"
                value={value?.interval || 1}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
              />
              <span className="text-sm text-muted-foreground">
                {value?.frequency === "daily" ? "day(s)" : value?.frequency === "weekly" ? "week(s)" : "month(s)"}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
              End date *
            </label>
            <input
              type="date"
              id="endDate"
              required
              value={value?.end_date || getDefaultEndDate()}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDate.slice(0, 10)}
              className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary/50"
            />
          </div>

          <Button type="button" variant="outline" onClick={handleDisable} className="w-full">
            Remove Recurrence
          </Button>
        </div>
      )}
    </div>
  );
}

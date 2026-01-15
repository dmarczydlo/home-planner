import { useCalendar } from "../../contexts/CalendarContext";

type CalendarView = "day" | "week" | "month" | "agenda";

interface ViewOption {
  value: CalendarView;
  label: string;
}

const viewOptions: ViewOption[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "agenda", label: "Agenda" },
];

export function ViewSwitcher() {
  const { state, setView } = useCalendar();

  const handleViewChange = (view: CalendarView) => {
    setView(view);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
      {viewOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleViewChange(option.value)}
          className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            state.view === option.value
              ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105"
              : "glass-effect text-muted-foreground hover:text-foreground hover:bg-card/60 border border-border/50"
          }`}
          aria-pressed={state.view === option.value}
          role="tab"
        >
          {state.view === option.value && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 animate-shimmer rounded-xl"></div>
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

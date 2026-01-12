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
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {viewOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleViewChange(option.value)}
          className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${
              state.view === option.value
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }
          `}
          aria-pressed={state.view === option.value}
          role="tab"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

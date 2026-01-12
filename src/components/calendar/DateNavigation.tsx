import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "../../contexts/CalendarContext";
import { navigateDate, formatDateRange } from "../../lib/calendar/dateUtils";

export function DateNavigation() {
  const { state, setCurrentDate } = useCalendar();

  const handlePrevious = () => {
    const newDate = navigateDate(state.currentDate, state.view, "previous");
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = navigateDate(state.currentDate, state.view, "next");
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    const current = state.currentDate;
    return (
      today.getFullYear() === current.getFullYear() &&
      today.getMonth() === current.getMonth() &&
      today.getDate() === current.getDate()
    );
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={handlePrevious}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatDateRange(state.view, state.currentDate)}
        </h2>
        {!isToday() && (
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

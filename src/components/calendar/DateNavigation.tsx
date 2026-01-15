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
        className="p-2 rounded-xl glass-effect hover:bg-card/60 transition-all duration-300 hover:scale-105"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <div className="flex items-center gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          {formatDateRange(state.view, state.currentDate)}
        </h2>
        {!isToday() && (
          <button
            onClick={handleToday}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary hover:text-white bg-primary/10 hover:bg-gradient-to-r hover:from-primary hover:to-secondary rounded-xl transition-all duration-300 border border-primary/30 hover:border-primary/50"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2 rounded-xl glass-effect hover:bg-card/60 transition-all duration-300 hover:scale-105"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}

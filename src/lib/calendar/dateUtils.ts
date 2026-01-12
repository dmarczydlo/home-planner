import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  format,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  subDays,
} from "date-fns";

type CalendarView = "day" | "week" | "month" | "agenda";

interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(view: CalendarView, currentDate: Date): DateRange {
  switch (view) {
    case "day":
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
      };
    case "week":
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    case "month":
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    case "agenda":
      return {
        start: startOfDay(currentDate),
        end: endOfDay(addDays(currentDate, 29)),
      };
    default:
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
      };
  }
}

export function navigateDate(currentDate: Date, view: CalendarView, direction: "previous" | "next"): Date {
  const multiplier = direction === "next" ? 1 : -1;

  switch (view) {
    case "day":
      return direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1);
    case "week":
      return direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    case "month":
      return direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case "agenda":
      return direction === "next" ? addDays(currentDate, 30) : subDays(currentDate, 30);
    default:
      return currentDate;
  }
}

export function formatDateRange(view: CalendarView, currentDate: Date): string {
  const range = getDateRange(view, currentDate);

  switch (view) {
    case "day":
      return format(currentDate, "MMMM d, yyyy");
    case "week": {
      const startMonth = format(range.start, "MMM");
      const endMonth = format(range.end, "MMM");
      const startDay = format(range.start, "d");
      const endDay = format(range.end, "d");
      const year = format(range.end, "yyyy");

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
    case "month":
      return format(currentDate, "MMMM yyyy");
    case "agenda":
      return "Upcoming Events";
    default:
      return format(currentDate, "MMMM d, yyyy");
  }
}

export function formatEventTime(startTime: string, endTime: string, isAllDay: boolean): string {
  if (isAllDay) {
    return "All day";
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

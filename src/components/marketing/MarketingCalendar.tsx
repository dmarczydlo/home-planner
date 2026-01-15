import { useEffect, useRef, useState } from "react";
import { createCalendar, viewWeek, viewDay } from "@schedule-x/calendar";
import "@schedule-x/theme-default/dist/index.css";
import "../../styles/schedule-x-custom.css";
import { Calendar, Users, Filter, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";

const familyMembers = [
  { id: "mom", name: "Sarah", color: "#8b5cf6", emoji: "👩" },
  { id: "dad", name: "Mike", color: "#06b6d4", emoji: "👨" },
  { id: "emma", name: "Emma", color: "#ec4899", emoji: "👧" },
  { id: "jack", name: "Jack", color: "#10b981", emoji: "👦" },
];

const getDateWithTime = (daysOffset: number, hours: number, minutes: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const dummyEvents = [
  {
    id: "1",
    title: "🎹 Piano Lesson",
    start: getDateWithTime(0, 16, 0),
    end: getDateWithTime(0, 17, 0),
    person: "emma",
    color: "#ec4899",
  },
  {
    id: "2",
    title: "⚽ Soccer Practice",
    start: getDateWithTime(1, 17, 30),
    end: getDateWithTime(1, 19, 0),
    person: "jack",
    color: "#10b981",
  },
  {
    id: "3",
    title: "👨‍💼 Team Meeting",
    start: getDateWithTime(0, 10, 0),
    end: getDateWithTime(0, 11, 30),
    person: "dad",
    color: "#06b6d4",
  },
  {
    id: "4",
    title: "🍽️ Family Dinner",
    start: getDateWithTime(2, 18, 0),
    end: getDateWithTime(2, 19, 30),
    person: "mom",
    color: "#8b5cf6",
  },
  {
    id: "5",
    title: "🏊 Swimming Lesson",
    start: getDateWithTime(3, 15, 0),
    end: getDateWithTime(3, 16, 0),
    person: "emma",
    color: "#ec4899",
  },
  {
    id: "6",
    title: "📚 Book Club",
    start: getDateWithTime(4, 19, 0),
    end: getDateWithTime(4, 20, 30),
    person: "mom",
    color: "#8b5cf6",
  },
  {
    id: "7",
    title: "🎨 Art Class",
    start: getDateWithTime(5, 14, 0),
    end: getDateWithTime(5, 15, 30),
    person: "jack",
    color: "#10b981",
  },
  {
    id: "8",
    title: "💼 Client Presentation",
    start: getDateWithTime(1, 14, 0),
    end: getDateWithTime(1, 16, 0),
    person: "dad",
    color: "#06b6d4",
  },
];

export function MarketingCalendar() {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    familyMembers.map((m) => m.id)
  );
  const [currentView, setCurrentView] = useState<"week" | "day">("week");
  const [showFilters, setShowFilters] = useState(false);
  const [calendarInstance, setCalendarInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!calendarRef.current) return;

    setIsLoading(true);

    try {
      const formatDateForScheduleX = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      const filteredEvents = dummyEvents
        .filter((event) => selectedMembers.includes(event.person))
        .map((event) => ({
          id: event.id,
          title: event.title,
          start: formatDateForScheduleX(event.start),
          end: formatDateForScheduleX(event.end),
          calendarId: event.person,
        }));

      console.log("Filtered events:", filteredEvents);

      const calendarsConfig = familyMembers.reduce((acc, member) => {
        acc[member.id] = {
          colorName: member.name,
          lightColors: {
            main: member.color,
            container: member.color,
            onContainer: "#ffffff",
          },
          darkColors: {
            main: member.color,
            container: member.color,
            onContainer: "#ffffff",
          },
        };
        return acc;
      }, {} as Record<string, any>);

      console.log("Calendars config:", calendarsConfig);
      console.log("Current view:", currentView);
      console.log("Selected date:", new Date().toISOString().slice(0, 10));

      const calendar = createCalendar({
        locale: "en-US",
        views: [viewWeek, viewDay],
        defaultView: currentView,
        selectedDate: new Date().toISOString().slice(0, 10),
        events: filteredEvents,
        calendars: calendarsConfig,
        weekOptions: {
          gridHeight: 800,
          nDays: 7,
        },
      });

      calendarRef.current.innerHTML = "";
      calendar.render(calendarRef.current);
      setCalendarInstance(calendar);
      setTimeout(() => setIsLoading(false), 300);
    } catch (error) {
      console.error("Error rendering calendar:", error);
      setIsLoading(false);
    }

    return () => {
      if (calendarRef.current) {
        calendarRef.current.innerHTML = "";
      }
    };
  }, [selectedMembers, currentView]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAllMembers = () => {
    if (selectedMembers.length === familyMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(familyMembers.map((m) => m.id));
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>

      <div className="relative">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg blur-sm opacity-60 animate-pulse"></div>
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Family Calendar</h3>
              <p className="text-xs text-muted-foreground">This week's schedule</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView("day")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                currentView === "day"
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCurrentView("week")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                currentView === "week"
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Filter Members
              </span>
              {selectedMembers.length > 0 && selectedMembers.length < familyMembers.length && (
                <Badge variant="secondary" className="text-xs animate-scale-in">
                  {selectedMembers.length} of {familyMembers.length}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showFilters ? "max-h-64" : "max-h-0"
            }`}
          >
            <div className="p-4 space-y-3 bg-card/40 backdrop-blur-sm border-b border-border/50">
              <button
                onClick={toggleAllMembers}
                className="w-full text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 text-xs font-medium text-foreground"
              >
                {selectedMembers.length === familyMembers.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                {familyMembers.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`relative overflow-hidden group px-3 py-2.5 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-primary/50 bg-primary/10 shadow-lg scale-105"
                          : "border-border/50 bg-card/50 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all duration-300 ${
                            isSelected
                              ? "scale-110"
                              : "scale-100 group-hover:scale-110"
                          }`}
                          style={{ backgroundColor: member.color + "20" }}
                        >
                          {member.emoji}
                        </div>
                        <span
                          className={`text-xs font-semibold transition-colors duration-300 ${
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {member.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-shimmer"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                <span className="text-sm text-muted-foreground font-medium">Loading calendar...</span>
              </div>
            </div>
          )}
          <div
            ref={calendarRef}
            className="sx-react-calendar-wrapper p-4 bg-background/50 backdrop-blur-sm min-h-[600px] animate-fade-in"
            style={{
              "--sx-color-primary": "139 92 246",
              "--sx-color-on-primary": "255 255 255",
            } as React.CSSProperties}
          ></div>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2 animate-slide-up">
          <div className="glass-effect rounded-xl px-4 py-2 border border-primary/30 shadow-xl">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {dummyEvents.filter((e) => selectedMembers.includes(e.person)).length} Events
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Users, Filter, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";
import { CustomWeekView } from "./CustomWeekView";
import { CustomDayView } from "./CustomDayView";
import { CustomMonthView } from "./CustomMonthView";
import "./MarketingCalendar.css";

const familyMembers = [
  { id: "mom", name: "Sarah", color: "#8b5cf6", emoji: "👩" },
  { id: "dad", name: "Mike", color: "#06b6d4", emoji: "👨" },
  { id: "emma", name: "Emma", color: "#ec4899", emoji: "👧" },
  { id: "jack", name: "Jack", color: "#10b981", emoji: "👦" },
];

const getDateWithTime = (daysOffset: number, hours: number, minutes = 0) => {
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>(familyMembers.map((m) => m.id));
  const [currentView, setCurrentView] = useState<"week" | "day" | "month">("week");
  const [selectedDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    return dummyEvents.filter((event) => selectedMembers.includes(event.person));
  }, [selectedMembers]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
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
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-secondary/5 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-glow"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_60%)]"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="glass-effect border-b border-primary/20 backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Family Calendar</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  Perfect coordination, zero chaos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentView("day")}
                className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
                  currentView === "day"
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105"
                    : "glass-effect text-muted-foreground hover:text-foreground hover:bg-card/60 border border-border/50"
                }`}
              >
                {currentView === "day" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 animate-shimmer rounded-xl"></div>
                )}
                <span className="relative">Day</span>
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
                  currentView === "week"
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105"
                    : "glass-effect text-muted-foreground hover:text-foreground hover:bg-card/60 border border-border/50"
                }`}
              >
                {currentView === "week" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 animate-shimmer rounded-xl"></div>
                )}
                <span className="relative">Week</span>
              </button>
              <button
                onClick={() => setCurrentView("month")}
                className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
                  currentView === "month"
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105"
                    : "glass-effect text-muted-foreground hover:text-foreground hover:bg-card/60 border border-border/50"
                }`}
              >
                {currentView === "month" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 animate-shimmer rounded-xl"></div>
                )}
                <span className="relative">Month</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative border-b border-primary/10">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass-effect hover:bg-card/40 backdrop-blur-xl transition-all duration-300 group"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Filter className="relative w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground">Filter Members</span>
              {selectedMembers.length > 0 && selectedMembers.length < familyMembers.length && (
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 animate-scale-in bg-primary/20 text-primary border-primary/30"
                >
                  {selectedMembers.length} of {familyMembers.length}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-all duration-300 ${
                showFilters ? "rotate-180 text-primary" : "group-hover:text-foreground"
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showFilters ? "max-h-80" : "max-h-0"
            }`}
          >
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 glass-effect border-b border-primary/10 backdrop-blur-2xl">
              <button
                onClick={toggleAllMembers}
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl glass-effect hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 text-xs sm:text-sm font-semibold text-foreground group"
              >
                <span className="group-hover:translate-x-1 inline-block transition-transform">
                  {selectedMembers.length === familyMembers.length ? "Deselect All" : "Select All"}
                </span>
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                {familyMembers.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`relative overflow-hidden group px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-primary/60 bg-gradient-to-br from-primary/20 to-secondary/10 shadow-lg shadow-primary/20 scale-105"
                          : "border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all duration-300 ${
                            isSelected ? "scale-110 shadow-md" : "scale-100 group-hover:scale-110"
                          }`}
                          style={{
                            backgroundColor: isSelected ? member.color + "30" : member.color + "15",
                            boxShadow: isSelected ? `0 4px 12px ${member.color}40` : "none",
                          }}
                        >
                          {member.emoji}
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-bold transition-colors duration-300 ${
                            isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {member.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-shimmer rounded-xl"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 overflow-hidden marketing-calendar-wrapper">
          <div className="h-full p-3 sm:p-6 animate-fade-in">
            {currentView === "week" ? (
              <CustomWeekView events={filteredEvents} selectedDate={selectedDate} />
            ) : currentView === "day" ? (
              <CustomDayView events={filteredEvents} selectedDate={selectedDate} />
            ) : (
              <CustomMonthView events={filteredEvents} selectedDate={selectedDate} />
            )}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
          <div className="glass-effect rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-3 border border-primary/30 shadow-2xl backdrop-blur-2xl glow-effect">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-lg blur-sm"></div>
                <Users className="relative w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Active Events</span>
                <span className="text-base sm:text-lg font-bold text-foreground">{filteredEvents.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

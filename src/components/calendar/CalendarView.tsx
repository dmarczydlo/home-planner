import { useState } from "react";
import { CalendarProvider, useCalendar } from "../../contexts/CalendarContext";
import { CalendarHeader } from "./CalendarHeader";
import { ViewSwitcher } from "./ViewSwitcher";
import { DateNavigation } from "./DateNavigation";
import { MemberFilter } from "./MemberFilter";
import { FloatingActionButton } from "./FloatingActionButton";
import { EventCreateModal } from "./EventCreateModal";
import { useCalendarEvents } from "../../hooks/useCalendarEvents";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { AgendaView } from "./AgendaView";

interface CalendarViewProps {
  familyId: string;
  initialView?: "day" | "week" | "month" | "agenda";
}

function CalendarContent({ familyId }: { familyId: string }) {
  const { state } = useCalendar();
  const { events, isLoading, error, refetch } = useCalendarEvents(familyId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateEvent = () => {
    setIsCreateModalOpen(true);
  };

  const handleEventCreated = () => {
    refetch();
  };

  const renderView = () => {
    const viewProps = { events, isLoading };

    switch (state.view) {
      case "day":
        return <DayView {...viewProps} />;
      case "week":
        return <WeekView {...viewProps} />;
      case "month":
        return <MonthView {...viewProps} />;
      case "agenda":
        return <AgendaView {...viewProps} />;
      default:
        return <WeekView {...viewProps} />;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load calendar</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader />

      <div className="px-4 py-3 space-y-3">
        <ViewSwitcher />
        <DateNavigation />
      </div>

      <MemberFilter familyId={familyId} />

      <div className="flex-1 overflow-auto">{renderView()}</div>

      <FloatingActionButton onClick={handleCreateEvent} />

      <EventCreateModal
        familyId={familyId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}

export function CalendarView({ familyId, initialView = "week" }: CalendarViewProps) {
  return (
    <CalendarProvider initialView={initialView}>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        <CalendarContent familyId={familyId} />
      </div>
    </CalendarProvider>
  );
}

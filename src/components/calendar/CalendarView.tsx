import { useState } from "react";
import { CalendarProvider, useCalendar } from "../../contexts/CalendarContext";
import { CalendarHeader } from "./CalendarHeader";
import { ViewSwitcher } from "./ViewSwitcher";
import { DateNavigation } from "./DateNavigation";
import { MemberFilter } from "./MemberFilter";
import { FloatingActionButton } from "./FloatingActionButton";
import { EventCreateModal } from "./EventCreateModal";
import { EventEditModal } from "./EventEditModal";
import { useCalendarEvents } from "../../hooks/useCalendarEvents";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { AgendaView } from "./AgendaView";
import type { EventWithParticipantsDTO } from "../../types";

interface CalendarViewProps {
  familyId: string;
  initialView?: "day" | "week" | "month" | "agenda";
}

function CalendarContent({ familyId }: { familyId: string }) {
  const { state } = useCalendar();
  const { events, isLoading, error, refetch } = useCalendarEvents(familyId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithParticipantsDTO | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCreateEvent = () => {
    setIsCreateModalOpen(true);
  };

  const handleEventCreated = () => {
    refetch();
  };

  const handleSelectEvent = (event: EventWithParticipantsDTO) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleEventUpdated = () => {
    refetch();
  };

  const handleEventDeleted = () => {
    refetch();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const renderView = () => {
    const viewProps = { events, isLoading, onSelectEvent: handleSelectEvent };

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
    <div className="flex flex-col h-full pt-20">
      <div className="bg-card/30 backdrop-blur-sm border-b border-border/50 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <CalendarHeader />
          <ViewSwitcher />
        </div>
        <div className="flex items-center justify-between gap-4">
          <DateNavigation />
          <MemberFilter familyId={familyId} />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background">
        {renderView()}
      </div>

      <FloatingActionButton onClick={handleCreateEvent} />

      <EventCreateModal
        familyId={familyId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <EventEditModal
        event={selectedEvent}
        familyId={familyId}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
}

export function CalendarView({ familyId, initialView = "week" }: CalendarViewProps) {
  return (
    <CalendarProvider initialView={initialView}>
      <div className="h-screen flex flex-col bg-background">
        <CalendarContent familyId={familyId} />
      </div>
    </CalendarProvider>
  );
}

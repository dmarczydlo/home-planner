
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@/test/utils/render";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "./CalendarView";
import { createMockEvent } from "@/test/utils/mock-data";

vi.mock("@/lib/auth/supabaseAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/supabaseAuth")>();
  const mockUnsubscribe = vi.fn();
  const mockSubscription = {
    unsubscribe: mockUnsubscribe,
  };

  const createMockClient = () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn((callback) => {
        callback("SIGNED_OUT", null);
        return {
          data: {
            subscription: mockSubscription,
          },
        };
      }),
    },
  });

  return {
    ...actual,
    createSupabaseClientForAuth: vi.fn(createMockClient),
    signInWithGoogle: vi.fn(),
  };
});

global.fetch = vi.fn();

vi.mock("./EventEditModal", () => ({
  EventEditModal: ({ isOpen, onClose }: any) => (isOpen ? <div data-testid="event-edit-modal">Edit Modal</div> : null),
}));

vi.mock("./CustomCalendarDayView", () => ({
  CustomCalendarDayView: ({ events, onSelectEvent }: any) => (
    <div data-testid="day-view">
      <div>Day View - {events.length} events</div>
      {events.length > 0 && (
        <button onClick={() => onSelectEvent(events[0])} data-testid="select-event">
          Select Event
        </button>
      )}
    </div>
  ),
}));

vi.mock("./CustomCalendarWeekView", () => ({
  CustomCalendarWeekView: ({ events, onSelectEvent }: any) => (
    <div data-testid="week-view">
      <div>Week View - {events.length} events</div>
      {events.length > 0 && (
        <button onClick={() => onSelectEvent(events[0])} data-testid="select-event">
          Select Event
        </button>
      )}
    </div>
  ),
}));

vi.mock("./CustomCalendarMonthView", () => ({
  CustomCalendarMonthView: ({ events, onSelectEvent }: any) => (
    <div data-testid="month-view">
      <div>Month View - {events.length} events</div>
      {events.length > 0 && (
        <button onClick={() => onSelectEvent(events[0])} data-testid="select-event">
          Select Event
        </button>
      )}
    </div>
  ),
}));

vi.mock("./AgendaView", () => ({
  AgendaView: ({ events, onSelectEvent }: any) => (
    <div data-testid="agenda-view">
      <div>Agenda View - {events.length} events</div>
      {events.length > 0 && (
        <button onClick={() => onSelectEvent(events[0])} data-testid="select-event">
          Select Event
        </button>
      )}
    </div>
  ),
}));

describe("CalendarView", () => {
  const mockFamilyId = "test-family-123";

  beforeEach(() => {
    if (vi.isMockFunction(global.fetch)) {
      vi.mocked(global.fetch).mockClear();
    }
  });

  describe("Rendering", () => {
    it("renders default view (week)", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("week-view")).toBeInTheDocument();
      });
    });

    it("renders with initial view", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} initialView="day" />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("day-view")).toBeInTheDocument();
      });
    });

    it("renders CalendarHeader components", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /week/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      });
    });

    it("renders FloatingActionButton", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create new event/i })).toBeInTheDocument();
      });
    });

    it("renders MemberFilter", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });
    });
  });

  describe("View Switching", () => {
    it("switches between views", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      const user = userEvent.setup();
      render(<CalendarView familyId={mockFamilyId} />);

      await waitFor(() => {
        expect(screen.getByTestId("week-view")).toBeInTheDocument();
      });

      // Act
      const dayTab = screen.getByRole("tab", { name: /day/i });
      await user.click(dayTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("day-view")).toBeInTheDocument();
      });
    });

    it("displays events correctly in each view", async () => {
      // Arrange
      const mockEvents = [
        createMockEvent({ id: "event-1", family_id: mockFamilyId }),
        createMockEvent({ id: "event-2", family_id: mockFamilyId }),
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: mockEvents }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/week view - 2 events/i)).toBeInTheDocument();
      });
    });
  });

  describe("Event Handling", () => {
    it("opens create modal when FAB is clicked", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      const user = userEvent.setup();
      render(<CalendarView familyId={mockFamilyId} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create new event/i })).toBeInTheDocument();
      });

      // Act
      const fabButton = screen.getByRole("button", { name: /create new event/i });
      await user.click(fabButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /create new event/i })).toBeInTheDocument();
      });
    });

    it("opens edit modal when event is selected", async () => {
      // Arrange
      const mockEvent = createMockEvent({ id: "event-1", family_id: mockFamilyId });
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [mockEvent] }),
      } as Response);

      const user = userEvent.setup();
      render(<CalendarView familyId={mockFamilyId} />);

      await waitFor(() => {
        expect(screen.getByTestId("select-event")).toBeInTheDocument();
      });

      // Act
      const selectButton = screen.getByTestId("select-event");
      await user.click(selectButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("event-edit-modal")).toBeInTheDocument();
      });
    });

    it("refetches events after event is created", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      const user = userEvent.setup();
      render(<CalendarView familyId={mockFamilyId} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create new event/i })).toBeInTheDocument();
      });

      const fabButton = screen.getByRole("button", { name: /create new event/i });
      await user.click(fabButton);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /create new event/i })).toBeInTheDocument();
      });

      const initialFetchCount = vi.mocked(global.fetch).mock.calls.length;

      const mockSession = {
        access_token: "mock-token",
      };

      const supabaseAuth = await import("@/lib/auth/supabaseAuth");
      const mockUnsubscribe = vi.fn();
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: mockUnsubscribe },
            },
          })),
        },
      } as any);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "event-123" }),
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ events: [createMockEvent()] }),
      } as Response);

      const titleInput = screen.getByLabelText(/event title/i);
      const startInput = screen.getByLabelText(/start time/i);
      const endInput = screen.getByLabelText(/end time/i);

      const now = new Date();
      const endTime = new Date(now.getTime() + 3600000);

      await user.clear(titleInput);
      await user.type(titleInput, "Test Event");
      await user.clear(startInput);
      await user.type(startInput, now.toISOString().slice(0, 16));
      await user.clear(endInput);
      await user.type(endInput, endTime.toISOString().slice(0, 16));

      const submitButton = screen.getByRole("button", { name: /create event/i });
      await user.click(submitButton);

      // Assert
      await waitFor(
        () => {
          expect(vi.mocked(global.fetch).mock.calls.length).toBeGreaterThan(initialFetchCount + 1);
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Error Handling", () => {
    it("handles error state", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to load calendar/i)).toBeInTheDocument();
      });
    });

    it("displays error message", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("handles loading state", async () => {
      // Arrange
      let resolveFetch: ((value: any) => void) | null = null;
      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      );

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      expect(screen.getByRole("button", { name: /create new event/i })).toBeInTheDocument();

      if (!resolveFetch) {
        throw new Error("Expected fetch promise resolver to be set");
      }

      await act(async () => {
        (resolveFetch as (value: any) => void)({
          ok: true,
          status: 200,
          json: async () => ({ events: [] }),
        } as Response);
        await Promise.resolve();
      });
    });
  });

  describe("Empty State", () => {
    it("handles empty state (no events)", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/week view - 0 events/i)).toBeInTheDocument();
      });
    });
  });

  describe("Mobile Responsive", () => {
    it("has responsive layout classes", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ events: [] }),
      } as Response);

      // Act
      const { container } = render(<CalendarView familyId={mockFamilyId} />);

      // Assert
      await waitFor(() => {
        const mainContainer = container.querySelector(".flex.flex-col");
        expect(mainContainer).toBeInTheDocument();
      });
    });
  });
});

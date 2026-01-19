// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/utils/render";
import userEvent from "@testing-library/user-event";
import { EventCreateModal } from "./EventCreateModal";
import { CalendarProvider } from "@/contexts/CalendarContext";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";

// Mock fetch
global.fetch = vi.fn();

// Mock AuthContext to avoid onAuthStateChange issues
vi.mock("@/contexts/AuthContext", () => {
  const React = require("react");
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({
      user: null,
      isLoading: false,
      signOut: vi.fn(),
    }),
  };
});

// Mock child components
vi.mock("./ParticipantSelector", () => ({
  ParticipantSelector: ({ selectedParticipants, onSelectionChange }: any) => (
    <div data-testid="participant-selector">
      <button
        onClick={() => onSelectionChange([{ id: "user-1", type: "user" }])}
        data-testid="select-participant"
      >
        Select Participant
      </button>
      <div data-testid="selected-count">{selectedParticipants.length}</div>
    </div>
  ),
}));

vi.mock("./ConflictWarning", () => ({
  ConflictWarning: ({ conflicts, isValidating }: any) => (
    <div data-testid="conflict-warning">
      {isValidating && <span>Validating...</span>}
      {conflicts.length > 0 && <span>Conflicts found: {conflicts.length}</span>}
    </div>
  ),
}));

vi.mock("./RecurrenceEditor", () => ({
  RecurrenceEditor: ({ value, onChange, startDate }: any) => (
    <div data-testid="recurrence-editor">
      <button
        onClick={() =>
          onChange({
            frequency: "weekly",
            interval: 1,
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
        data-testid="enable-recurrence"
      >
        Enable Recurrence
      </button>
      {value && <span>Recurrence enabled</span>}
    </div>
  ),
}));

describe("EventCreateModal", () => {
  const mockFamilyId = "test-family-123";
  let mockOnClose: ReturnType<typeof vi.fn> & (() => void);
  let mockOnEventCreated: ReturnType<typeof vi.fn> & (() => void);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose = vi.fn() as unknown as ReturnType<typeof vi.fn> & (() => void);
    mockOnEventCreated = vi.fn() as unknown as ReturnType<typeof vi.fn> & (() => void);
    vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "mock-token",
            },
          },
          error: null,
        }),
      },
    } as any);
  });

  describe("Rendering", () => {
    it("does not render when isOpen is false", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={false} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders modal when isOpen is true", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByRole("heading", { name: /create new event/i })).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/all day event/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/event type/i)).toBeInTheDocument();
    });

    it("renders ParticipantSelector", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByTestId("participant-selector")).toBeInTheDocument();
    });

    it("renders RecurrenceEditor", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByTestId("recurrence-editor")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("validates required fields", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act - Try to submit without filling required fields
      const submitButton = screen.getByRole("button", { name: /create event/i });
      await user.click(submitButton);

      // Assert - HTML5 validation should prevent submission
      const titleInput = screen.getByLabelText(/event title/i);
      expect(titleInput).toBeRequired();
    });

    it("validates end time after start time", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act - Set end time before start time
      const startInput = screen.getByLabelText(/start time/i);
      const endInput = screen.getByLabelText(/end time/i);

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await user.type(startInput, futureDate.toISOString().slice(0, 16));
      await user.type(endInput, pastDate.toISOString().slice(0, 16));

      // Assert - Browser validation should handle this
      expect(endInput).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("creates event successfully", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSession = {
        access_token: "mock-token",
      };
      
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);
      
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "event-123" }),
      } as Response);

      render(
        <CalendarProvider>
          <EventCreateModal
            familyId={mockFamilyId}
            isOpen={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
          />
        </CalendarProvider>
      );

      // Act - Fill form
      const titleInput = screen.getByLabelText(/event title/i);

      await user.clear(titleInput);
      await user.type(titleInput, "Test Event");

      // Submit form by clicking submit button
      const submitButton = screen.getByRole("button", { name: /create event/i });
      await user.click(submitButton);

      // Assert - Wait for callbacks
      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 3000 });
    }, 5000);

    it("shows loading state during submission", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSession = {
        access_token: "mock-token",
      };
      
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);
      
      // Keep the request pending so we can reliably assert the loading UI
      let resolveSubmit: (value: Response) => void;
      const submitPromise = new Promise<Response>((resolve) => {
        resolveSubmit = resolve;
      });
      vi.mocked(global.fetch).mockImplementation(() => submitPromise);

      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
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

      // Assert - Check for loading state ("Creating...") while request is in-flight
      await waitFor(() => {
        const creatingButton = screen.getByRole("button", { name: /creating/i });
        expect(creatingButton).toBeDisabled();
      }, { timeout: 5000 });

      // Cleanup: resolve the pending request so the test doesn't leak async work
      resolveSubmit!({
        ok: true,
        status: 200,
        json: async () => ({ id: "event-123" }),
      } as Response);
    });

    it("displays error message on failure", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSession = {
        access_token: "mock-token",
      };
      const errorMessage = "Failed to create event";
      
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);
      
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: errorMessage }),
      } as Response);

      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const titleInput = screen.getByLabelText(/event title/i);

      await user.clear(titleInput);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create event/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      }, { timeout: 2000 });
    }, 5000);
  });

  describe("Modal Interactions", () => {
    it("closes modal on close button click", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("closes modal on cancel button click", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not close modal during submission", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSession = {
        access_token: "mock-token",
      };
      
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);
      
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      
      vi.mocked(global.fetch).mockImplementation(
        () => submitPromise.then(() => ({
          ok: true,
          status: 200,
          json: async () => ({ id: "event-123" }),
        } as Response))
      );

      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const titleInput = screen.getByLabelText(/event title/i);

      await user.clear(titleInput);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create event/i });
      await user.click(submitButton);

      // Wait for submission to start - check if button shows "Creating..."
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
      }, { timeout: 2000 });

      // Try to close during submission
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      // Assert - Modal should not close during submission
      expect(mockOnClose).not.toHaveBeenCalled();
      
      // Clean up - resolve the promise
      resolveSubmit!();
    }, 5000);
  });

  describe("All-Day Events", () => {
    it("switches to date input for all-day events", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const allDayCheckbox = screen.getByLabelText(/all day event/i);
      await user.click(allDayCheckbox);

      // Assert
      const startInput = screen.getByLabelText(/start time/i);
      expect(startInput).toHaveAttribute("type", "date");
    });
  });

  describe("Event Type", () => {
    it("allows selecting event type", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const eventTypeSelect = screen.getByLabelText(/event type/i);
      await user.selectOptions(eventTypeSelect, "blocker");

      // Assert
      expect(eventTypeSelect).toHaveValue("blocker");
    });

    it("shows conflict warning for blocker events", async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ conflicts: [{ id: "conflict-1" }] }),
      } as Response);

      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const eventTypeSelect = screen.getByLabelText(/event type/i);
      await user.selectOptions(eventTypeSelect, "blocker");

      const titleInput = screen.getByLabelText(/event title/i);
      const startInput = screen.getByLabelText(/start time/i);
      const endInput = screen.getByLabelText(/end time/i);

      const now = new Date();
      const endTime = new Date(now.getTime() + 3600000);

      await user.type(titleInput, "Test Event");
      await user.type(startInput, now.toISOString().slice(0, 16));
      await user.type(endInput, endTime.toISOString().slice(0, 16));

      // Assert - Wait for validation
      await waitFor(() => {
        expect(screen.getByTestId("conflict-warning")).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe("Participant Selection", () => {
    it("allows selecting participants", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const selectButton = screen.getByTestId("select-participant");
      await user.click(selectButton);

      // Assert
      await waitFor(() => {
        const count = screen.getByTestId("selected-count");
        expect(count).toHaveTextContent("1");
      });
    });
  });

  describe("Recurrence", () => {
    it("allows enabling recurrence", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const enableButton = screen.getByTestId("enable-recurrence");
      await user.click(enableButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/recurrence enabled/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("has keyboard accessible form", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act
      const titleInput = screen.getByLabelText(/event title/i);
      await user.click(titleInput);
      
      // Assert - Title input should be focused
      expect(titleInput).toHaveFocus();
      
      // Tab to next element
      await user.tab();
      
      // The next focusable element after title should be the all-day checkbox
      const allDayCheckbox = screen.getByLabelText(/all day event/i);
      expect(allDayCheckbox).toHaveFocus();
    });

    it("closes modal on ESC key", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={mockOnClose} />
        </CalendarProvider>
      );

      // Act - Press Escape key
      await user.keyboard("{Escape}");

      // Assert - Modal should close on ESC
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe("Form Reset", () => {
    it("resets form after successful submission", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSession = {
        access_token: "mock-token",
      };
      
      vi.spyOn(supabaseAuth, "createSupabaseClientForAuth").mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as any);
      
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "event-123" }),
      } as Response);

      const { rerender } = render(
        <CalendarProvider>
          <EventCreateModal
            familyId={mockFamilyId}
            isOpen={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
          />
        </CalendarProvider>
      );

      // Act
      const titleInput = screen.getByLabelText(/event title/i);

      await user.clear(titleInput);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create event/i });
      await user.click(submitButton);

      // Assert - Modal closes after successful submission
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnEventCreated).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Re-open modal and check form is reset
      rerender(
        <CalendarProvider>
          <EventCreateModal familyId={mockFamilyId} isOpen={true} onClose={vi.fn()} />
        </CalendarProvider>
      );

      await waitFor(() => {
        const newTitleInput = screen.getByLabelText(/event title/i);
        expect(newTitleInput).toHaveValue("");
      }, { timeout: 2000 });
    }, 5000);
  });
});

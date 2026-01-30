
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/render";
import { userEvent } from "@testing-library/user-event";
import { MemberFilter } from "./MemberFilter";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { createMockChild } from "@/test/utils/mock-data";

global.fetch = vi.fn();

describe("MemberFilter", () => {
  const mockFamilyId = "test-family-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders filter header", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ members: [] }),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      } as Response);

      // Act
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });
    });

    it("shows loading state initially", () => {
      // Arrange
      vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));

      // Act
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      // Assert
      const loadingSkeleton = document.querySelector(".animate-pulse");
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it("renders members when loaded", async () => {
      // Arrange
      const mockMembers = [
        { user_id: "user-1", full_name: "User 1", avatar_url: null },
        { user_id: "user-2", full_name: "User 2", avatar_url: null },
      ];
      const mockChildren = [createMockChild({ name: "Child 1" })];

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ members: mockMembers }),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: mockChildren }),
      } as Response);

      // Act
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });

      const headerButton = screen.getByText(/filter by members/i);
      const user = userEvent.setup();
      await user.click(headerButton);

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText("User 1")).toBeInTheDocument();
          expect(screen.getByText("User 2")).toBeInTheDocument();
          expect(screen.getByText("Child 1")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("User Interactions", () => {
    it("expands and collapses filter", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ members: [] }),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      } as Response);

      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });

      // Act
      const headerButton = screen.getByText(/filter by members/i);
      await user.click(headerButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/select all/i)).toBeInTheDocument();
      });

      // Act
      await user.click(headerButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/select all/i)).not.toBeInTheDocument();
      });
    });

    it("toggles member selection", async () => {
      // Arrange
      const mockMembers = [{ user_id: "user-1", full_name: "User 1", avatar_url: null }];
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ members: mockMembers }),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      } as Response);

      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });

      const headerButton = screen.getByText(/filter by members/i);
      await user.click(headerButton);

      await waitFor(() => {
        expect(screen.getByText("User 1")).toBeInTheDocument();
      });

      // Act
      const checkbox = screen.getByLabelText(/user 1/i);
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });

    it("toggles select all", async () => {
      // Arrange
      const mockMembers = [
        { user_id: "user-1", full_name: "User 1", avatar_url: null },
        { user_id: "user-2", full_name: "User 2", avatar_url: null },
      ];
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ members: mockMembers }),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      } as Response);

      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });

      const headerButton = screen.getByText(/filter by members/i);
      await user.click(headerButton);

      await waitFor(() => {
        expect(screen.getByText(/select all/i)).toBeInTheDocument();
      });

      // Act
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      // Assert
      await waitFor(() => {
        expect(selectAllCheckbox).toBeChecked();
        expect(screen.getByLabelText(/user 1/i)).toBeChecked();
        expect(screen.getByLabelText(/user 2/i)).toBeChecked();
      });
    });
  });

  describe("Accessibility", () => {
    it("has keyboard accessible filter header", async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ members: [] }),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      } as Response);

      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <MemberFilter familyId={mockFamilyId} />
        </CalendarProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/filter by members/i)).toBeInTheDocument();
      });

      // Act
      const headerButton = screen.getByText(/filter by members/i);
      await user.click(headerButton);

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText(/select all/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});

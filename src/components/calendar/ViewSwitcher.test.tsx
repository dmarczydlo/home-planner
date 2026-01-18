// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/render";
import { userEvent } from "@testing-library/user-event";
import { ViewSwitcher } from "./ViewSwitcher";
import { CalendarProvider } from "@/contexts/CalendarContext";

describe("ViewSwitcher", () => {
  describe("Rendering", () => {
    it("renders all view options", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <ViewSwitcher />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByRole("tab", { name: /day/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /week/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /month/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /agenda/i })).toBeInTheDocument();
    });

    it("highlights active view", () => {
      // Arrange & Act
      render(
        <CalendarProvider initialView="week">
          <ViewSwitcher />
        </CalendarProvider>
      );

      // Assert
      const weekButton = screen.getByRole("tab", { name: /week/i });
      expect(weekButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("User Interactions", () => {
    it("switches view on click", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider initialView="week">
          <ViewSwitcher />
        </CalendarProvider>
      );

      // Act
      const dayButton = screen.getByRole("tab", { name: /day/i });
      await user.click(dayButton);

      // Assert
      expect(dayButton).toHaveAttribute("aria-pressed", "true");
    });

    it("updates active view when switching", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider initialView="week">
          <ViewSwitcher />
        </CalendarProvider>
      );

      // Act
      const monthButton = screen.getByRole("tab", { name: /month/i });
      await user.click(monthButton);

      // Assert
      expect(monthButton).toHaveAttribute("aria-pressed", "true");
      const weekButton = screen.getByRole("tab", { name: /week/i });
      expect(weekButton).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("Accessibility", () => {
    it("has ARIA tabs pattern", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <ViewSwitcher />
        </CalendarProvider>
      );

      // Assert
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("role", "tab");
        expect(tab).toHaveAttribute("aria-pressed");
      });
    });

    it("is keyboard accessible", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <ViewSwitcher />
        </CalendarProvider>
      );

      // Act
      const dayButton = screen.getByRole("tab", { name: /day/i });
      dayButton.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(dayButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});

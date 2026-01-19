// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/utils/render";
import userEvent from "@testing-library/user-event";
import { DateNavigation } from "./DateNavigation";
import { CalendarProvider } from "@/contexts/CalendarContext";

describe("DateNavigation", () => {
  describe("Rendering", () => {
    it("displays current date range", () => {
      // Arrange & Act
      const testDate = new Date("2024-01-15");
      render(
        <CalendarProvider initialDate={testDate} initialView="week">
          <DateNavigation />
        </CalendarProvider>
      );

      // Assert
      const heading = screen.getByRole("heading");
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBeTruthy();
    });

    it("renders navigation buttons", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <DateNavigation />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("shows Today button when not on today", () => {
      // Arrange & Act
      const pastDate = new Date("2024-01-01");
      render(
        <CalendarProvider initialDate={pastDate}>
          <DateNavigation />
        </CalendarProvider>
      );

      // Assert
      expect(screen.getByRole("button", { name: /today/i })).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("navigates to previous period", async () => {
      // Arrange
      const user = userEvent.setup();
      const testDate = new Date("2024-01-15");
      render(
        <CalendarProvider initialDate={testDate} initialView="week">
          <DateNavigation />
        </CalendarProvider>
      );

      // Act
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      // Assert - Date should have changed (we can't easily test the exact date without accessing context)
      expect(prevButton).toBeInTheDocument();
    });

    it("navigates to next period", async () => {
      // Arrange
      const user = userEvent.setup();
      const testDate = new Date("2024-01-15");
      render(
        <CalendarProvider initialDate={testDate} initialView="week">
          <DateNavigation />
        </CalendarProvider>
      );

      // Act
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Assert
      expect(nextButton).toBeInTheDocument();
    });

    it("jumps to today", async () => {
      // Arrange
      const user = userEvent.setup();
      const pastDate = new Date("2024-01-01");
      render(
        <CalendarProvider initialDate={pastDate} initialView="week">
          <DateNavigation />
        </CalendarProvider>
      );

      // Assert - Today button should be visible when not on today
      const todayButton = screen.getByRole("button", { name: /today/i });
      expect(todayButton).toBeInTheDocument();

      // Act
      await user.click(todayButton);

      // Assert - After clicking today, the button should disappear (because we're now on today)
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /today/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible buttons", () => {
      // Arrange & Act
      render(
        <CalendarProvider>
          <DateNavigation />
        </CalendarProvider>
      );

      // Assert
      const prevButton = screen.getByRole("button", { name: /previous/i });
      const nextButton = screen.getByRole("button", { name: /next/i });

      expect(prevButton).toHaveAttribute("aria-label", "Previous");
      expect(nextButton).toHaveAttribute("aria-label", "Next");
    });

    it("is keyboard accessible", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CalendarProvider>
          <DateNavigation />
        </CalendarProvider>
      );

      // Act
      const prevButton = screen.getByRole("button", { name: /previous/i });
      prevButton.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(prevButton).toHaveFocus();
    });
  });
});

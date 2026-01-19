// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils/render";
import userEvent from "@testing-library/user-event";
import { FloatingActionButton } from "./FloatingActionButton";

describe("FloatingActionButton", () => {
  describe("Rendering", () => {
    it("renders floating button", () => {
      // Arrange & Act
      const mockOnClick = vi.fn();
      render(<FloatingActionButton onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button", { name: /create new event/i });
      expect(button).toBeInTheDocument();
    });

    it("has proper ARIA label", () => {
      // Arrange & Act
      const mockOnClick = vi.fn();
      render(<FloatingActionButton onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button", { name: /create new event/i });
      expect(button).toHaveAttribute("aria-label", "Create new event");
    });

    it("is positioned correctly", () => {
      // Arrange & Act
      const mockOnClick = vi.fn();
      const { container } = render(<FloatingActionButton onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button", { name: /create new event/i });
      expect(button).toHaveClass("fixed", "bottom-8", "right-8");
    });
  });

  describe("User Interactions", () => {
    it("calls onClick when clicked", async () => {
      // Arrange
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);

      // Act
      const button = screen.getByRole("button", { name: /create new event/i });
      await user.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("is keyboard accessible", async () => {
      // Arrange
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);

      // Act
      const button = screen.getByRole("button", { name: /create new event/i });
      button.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("has focus visible styles", () => {
      // Arrange & Act
      const mockOnClick = vi.fn();
      render(<FloatingActionButton onClick={mockOnClick} />);

      // Act
      const button = screen.getByRole("button", { name: /create new event/i });
      button.focus();

      // Assert
      expect(button).toHaveFocus();
      expect(button).toHaveClass("focus:outline-none", "focus:ring-4");
    });
  });
});

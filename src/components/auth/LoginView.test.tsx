// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/render";
import { LoginView } from "./LoginView";

describe("LoginView", () => {
  describe("Rendering", () => {
    it("renders login form", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByText(/sign in to manage your family calendar/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
    });

    it("displays branding", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      expect(screen.getByText("Home Planner")).toBeInTheDocument();
      expect(screen.getByText("Your family, perfectly coordinated")).toBeInTheDocument();
    });

    it("shows legal links", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
      const termsLink = screen.getByRole("link", { name: /terms of service/i });

      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute("href", "/privacy");
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute("href", "/terms");
    });

    it("does not render error message when no error", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      const alerts = screen.queryAllByRole("alert");
      const errorAlerts = alerts.filter((alert) =>
        alert.textContent?.includes("Authentication failed") ||
        alert.textContent?.includes("error occurred")
      );
      expect(errorAlerts).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("displays error message when error exists", () => {
      // Arrange & Act
      render(<LoginView error="auth_failed" />);

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Authentication failed. Please try again.");
    });

    it("displays correct error message for auth_failed", () => {
      // Arrange & Act
      render(<LoginView error="auth_failed" />);

      // Assert
      expect(screen.getByText("Authentication failed. Please try again.")).toBeInTheDocument();
    });

    it("displays correct error message for no_code", () => {
      // Arrange & Act
      render(<LoginView error="no_code" />);

      // Assert
      expect(
        screen.getByText("Missing authentication code. Please try signing in again.")
      ).toBeInTheDocument();
    });

    it("displays correct error message for session_failed", () => {
      // Arrange & Act
      render(<LoginView error="session_failed" />);

      // Assert
      expect(screen.getByText("Failed to create session. Please try again.")).toBeInTheDocument();
    });

    it("displays correct error message for user_not_found", () => {
      // Arrange & Act
      render(<LoginView error="user_not_found" />);

      // Assert
      expect(screen.getByText("User account not found. Please contact support.")).toBeInTheDocument();
    });

    it("displays correct error message for user_creation_failed", () => {
      // Arrange & Act
      render(<LoginView error="user_creation_failed" />);

      // Assert
      expect(screen.getByText("Failed to create user account. Please try again.")).toBeInTheDocument();
    });

    it("displays correct error message for unexpected_error", () => {
      // Arrange & Act
      render(<LoginView error="unexpected_error" />);

      // Assert
      expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
    });

    it("displays default error message for unknown error code", () => {
      // Arrange & Act
      render(<LoginView error="unknown_error_code" />);

      // Assert
      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
    });

    it("handles null error prop", () => {
      // Arrange & Act
      render(<LoginView error={null} />);

      // Assert
      const alerts = screen.queryAllByRole("alert");
      const errorAlerts = alerts.filter((alert) =>
        alert.textContent?.includes("Authentication failed") ||
        alert.textContent?.includes("error occurred")
      );
      expect(errorAlerts).toHaveLength(0);
    });
  });

  describe("Accessibility", () => {
    it("has accessible form structure", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      const heading = screen.getByRole("heading", { name: /welcome back/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");

      const description = screen.getByText(/sign in to manage your family calendar/i);
      expect(description).toBeInTheDocument();
    });

    it("has proper ARIA attributes for error alert", () => {
      // Arrange & Act
      render(<LoginView error="auth_failed" />);

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
      expect(alert).toHaveAttribute("role", "alert");
    });

    it("has accessible links", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
      const termsLink = screen.getByRole("link", { name: /terms of service/i });

      expect(privacyLink).toBeInTheDocument();
      expect(termsLink).toBeInTheDocument();
    });

    it("has proper heading hierarchy", () => {
      // Arrange & Act
      render(<LoginView />);

      // Assert
      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("Home Planner");

      const subHeading = screen.getByRole("heading", { level: 2 });
      expect(subHeading).toHaveTextContent("Welcome Back");
    });
  });

  describe("Responsive Design", () => {
    it("has responsive container classes", () => {
      // Arrange & Act
      const { container } = render(<LoginView />);

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("flex", "min-h-screen", "items-center", "justify-center", "p-4", "sm:p-6");
    });

    it("has responsive card padding", () => {
      // Arrange & Act
      const { container } = render(<LoginView />);

      // Assert - Check for card container with padding classes
      const card = container.querySelector(".bg-card\\/80");
      expect(card).toBeInTheDocument();
      if (card) {
        expect(card).toHaveClass("p-8", "sm:p-10");
      }
    });
  });
});


import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils/render";
import { userEvent } from "@testing-library/user-event";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import * as useAuthHook from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("AuthErrorDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("does not render when no error", () => {
      // Arrange
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      } as any);

      // Act
      const { container } = render(<AuthErrorDisplay />);

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("renders error message when error exists", () => {
      // Arrange
      const error = {
        message: "Authentication failed",
        code: "AUTH_ERROR",
        retryable: true,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      } as any);

      // Act
      render(<AuthErrorDisplay />);

      // Assert
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
      expect(screen.getByText(error.message)).toBeInTheDocument();
    });

    it("has proper ARIA role and attributes", () => {
      // Arrange
      const error = {
        message: "Test error",
        retryable: false,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      } as any);

      // Act
      render(<AuthErrorDisplay />);

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("User Interactions", () => {
    it("calls clearError when dismiss button is clicked", async () => {
      // Arrange
      const clearError = vi.fn();
      const error = {
        message: "Test error",
        retryable: false,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError,
      } as any);
      const user = userEvent.setup();
      render(<AuthErrorDisplay />);

      // Act
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await user.click(dismissButton);

      // Assert
      expect(clearError).toHaveBeenCalledTimes(1);
    });

    it("calls checkAuth and clearError when retry button is clicked", async () => {
      // Arrange
      const checkAuth = vi.fn();
      const clearError = vi.fn();
      const error = {
        message: "Test error",
        retryable: true,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth,
        refreshUser: vi.fn(),
        clearError,
      } as any);
      const user = userEvent.setup();
      render(<AuthErrorDisplay />);

      // Act
      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      // Assert
      expect(clearError).toHaveBeenCalledTimes(1);
      expect(checkAuth).toHaveBeenCalledTimes(1);
    });

    it("shows retry button only when error is retryable", () => {
      // Arrange
      const retryableError = {
        message: "Retryable error",
        retryable: true,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: retryableError,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      } as any);

      // Act
      render(<AuthErrorDisplay />);

      // Assert
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("shows only dismiss button when error is not retryable", () => {
      // Arrange
      const nonRetryableError = {
        message: "Non-retryable error",
        retryable: false,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: nonRetryableError,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      } as any);

      // Act
      render(<AuthErrorDisplay />);

      // Assert
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes for alert", () => {
      // Arrange
      const error = {
        message: "Test error",
        retryable: false,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      } as any);

      // Act
      render(<AuthErrorDisplay />);

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("buttons are keyboard accessible", async () => {
      // Arrange
      const clearError = vi.fn();
      const error = {
        message: "Test error",
        retryable: false,
      };
      vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn(),
        refreshUser: vi.fn(),
        clearError,
      } as any);
      const user = userEvent.setup();
      render(<AuthErrorDisplay />);

      // Act
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      dismissButton.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(clearError).toHaveBeenCalledTimes(1);
    });
  });
});

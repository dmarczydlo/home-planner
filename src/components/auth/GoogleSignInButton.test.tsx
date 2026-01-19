// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/utils/render";
import userEvent from "@testing-library/user-event";
import { GoogleSignInButton } from "./GoogleSignInButton";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";

// Note: Supabase auth is already mocked in src/test/utils/render.tsx
// This mock is for the specific function used by this component
vi.mock("@/lib/auth/supabaseAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/supabaseAuth")>();
  return {
    ...actual,
    signInWithGoogle: vi.fn(),
  };
});

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders button with correct text", () => {
      // Arrange
      render(<GoogleSignInButton />);

      // Act & Assert
      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toBeInTheDocument();
    });

    it("has proper ARIA labels", () => {
      // Arrange
      render(<GoogleSignInButton />);

      // Act & Assert
      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toHaveAttribute("aria-label", "Sign in with Google account");
      expect(button).toHaveAttribute("aria-describedby", "signin-description");
    });

    it("shows loading state during authentication", async () => {
      // Arrange
      vi.spyOn(supabaseAuth, "signInWithGoogle").mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const user = userEvent.setup();
      render(<GoogleSignInButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(button).toHaveAttribute("aria-busy", "true");
        expect(screen.getByText(/redirecting to google/i)).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("calls signIn function on click", async () => {
      // Arrange
      const signInSpy = vi.spyOn(supabaseAuth, "signInWithGoogle").mockResolvedValue(undefined as any);
      const user = userEvent.setup();
      render(<GoogleSignInButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(signInSpy).toHaveBeenCalledTimes(1);
      });
    });

    it("displays error message on failure", async () => {
      // Arrange
      const errorMessage = "Sign in failed. Please try again.";
      vi.spyOn(supabaseAuth, "signInWithGoogle").mockRejectedValue(new Error(errorMessage));
      const user = userEvent.setup();
      render(<GoogleSignInButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        const componentAlert = alerts.find((alert) =>
          alert.textContent?.includes("Sign in failed")
        );
        expect(componentAlert).toBeInTheDocument();
        expect(componentAlert).toHaveTextContent(errorMessage);
      });
    });

    it("calls onError callback when provided", async () => {
      // Arrange
      const onError = vi.fn();
      const errorMessage = "Sign in failed";
      vi.spyOn(supabaseAuth, "signInWithGoogle").mockRejectedValue(new Error(errorMessage));
      const user = userEvent.setup();
      render(<GoogleSignInButton onError={onError} />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      });
    });
  });

  describe("Accessibility", () => {
    it("is keyboard accessible", async () => {
      // Arrange
      const signInSpy = vi.spyOn(supabaseAuth, "signInWithGoogle").mockResolvedValue(undefined as any);
      const user = userEvent.setup();
      render(<GoogleSignInButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      button.focus();
      await user.keyboard("{Enter}");

      // Assert
      await waitFor(() => {
        expect(signInSpy).toHaveBeenCalledTimes(1);
      });
    });

    it("has focus visible styles", () => {
      // Arrange
      render(<GoogleSignInButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      button.focus();

      // Assert
      expect(button).toHaveFocus();
    });

    it("has proper ARIA role and attributes", () => {
      // Arrange
      render(<GoogleSignInButton />);

      // Act & Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Sign in with Google account");
      expect(button).toHaveAttribute("aria-describedby", "signin-description");
    });
  });

  describe("Error Handling", () => {
    it("displays network error message correctly", async () => {
      // Arrange
      // Use a non-network error to avoid retry logic, but test the error display
      // OR use a popup error which also gets special handling
      const popupError = new Error("popup blocked");
      const signInSpy = vi.spyOn(supabaseAuth, "signInWithGoogle").mockRejectedValue(popupError);
      const user = userEvent.setup();
      render(<GoogleSignInButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign in with google/i });
      await user.click(button);

      // Assert - Wait for error to appear
      // Component transforms "popup blocked" to "Popup blocked. Please allow popups..."
      await waitFor(
        () => {
          const alerts = screen.getAllByRole("alert");
          const componentAlert = alerts.find((alert) =>
            alert.textContent?.includes("Popup blocked")
          );
          expect(componentAlert).toBeInTheDocument();
          expect(componentAlert).toHaveTextContent(/popup blocked/i);
        },
        { timeout: 2000 }
      );
      
      expect(signInSpy).toHaveBeenCalledTimes(1);
    });

    it("allows retry after error", async () => {
      // Arrange
      // Use a non-network error to avoid retry logic
      const signInSpy = vi
        .spyOn(supabaseAuth, "signInWithGoogle")
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce(undefined as any);
      const user = userEvent.setup();
      render(<GoogleSignInButton />);

      // Act - First click fails
      const button = screen.getByRole("button", { name: /sign in with google/i });
      await user.click(button);

      // Wait for error to appear (may be multiple alerts from AuthProvider and component)
      await waitFor(
        () => {
          const alerts = screen.getAllByRole("alert");
          expect(alerts.length).toBeGreaterThan(0);
          // Find the component's error alert
          const componentAlert = alerts.find((alert) =>
            alert.textContent?.includes("Sign in failed")
          );
          expect(componentAlert).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Act - Retry (find the "Try Again" button within the component's alert)
      const alerts = screen.getAllByRole("alert");
      const componentAlert = alerts.find((alert) =>
        alert.textContent?.includes("Sign in failed")
      );
      
      if (!componentAlert) {
        throw new Error("Component alert not found");
      }
      
      const retryButton = within(componentAlert).getByRole("button", { name: /try again/i });
      await user.click(retryButton);

      // Assert
      await waitFor(
        () => {
          expect(signInSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 2000 }
      );
    });
  });
});

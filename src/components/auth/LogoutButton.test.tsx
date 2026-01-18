// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/render";
import { userEvent } from "@testing-library/user-event";
import { LogoutButton } from "./LogoutButton";
import * as supabaseAuth from "@/lib/auth/supabaseAuth";

// Note: Supabase auth is mocked at module level above

// Mock window.location
const mockLocation = {
  href: "",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Note: Supabase auth is already mocked in src/test/utils/render.tsx
// We just need to ensure the signOut mock is available for LogoutButton tests

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  describe("Rendering", () => {
    it("renders logout button", () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it("renders with default variant", () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it("renders with custom variant", () => {
      // Arrange & Act
      render(<LogoutButton variant="destructive" />);

      // Assert
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it("renders with custom size", () => {
      // Arrange & Act
      render(<LogoutButton size="sm" />);

      // Assert
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      // Arrange & Act
      const { container } = render(<LogoutButton className="custom-class" />);

      // Assert
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("User Interactions", () => {
    it("calls logout function on click", async () => {
      // Arrange
      // The mock is already set up in render.tsx, but we need to spy on it
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it("calls logout API endpoint", async () => {
      // Arrange
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
          method: "POST",
        });
      });
    });

    it("redirects to home page after successful logout", async () => {
      // Arrange
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe("/");
      });
    });

    it("redirects to home page even on error", async () => {
      // Arrange
      const mockSignOut = vi.fn().mockRejectedValue(new Error("Logout failed"));
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe("/");
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it("shows loading state during logout", async () => {
      // Arrange
      const mockSignOut = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(button).toHaveTextContent("Signing out...");
        expect(button).toBeDisabled();
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it("disables button during logout", async () => {
      // Arrange
      const mockSignOut = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("is keyboard accessible", async () => {
      // Arrange
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      const createClientSpy = vi.spyOn(supabaseAuth, "createSupabaseClientForAuth");
      createClientSpy.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signOut: mockSignOut,
          onAuthStateChange: vi.fn(() => ({
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          })),
        },
      } as any);
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      button.focus();
      await user.keyboard("{Enter}");

      // Assert
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it("has proper ARIA role", () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it("has focus visible styles", () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Act
      const button = screen.getByRole("button", { name: /sign out/i });
      button.focus();

      // Assert
      expect(button).toHaveFocus();
    });
  });
});

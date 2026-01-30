
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@/test/utils/render";
import { useOnboarding } from "./useOnboarding";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { createMockChild } from "@/test/utils/mock-data";

describe("useOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("returns initial state", () => {
      // Arrange & Act
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Assert
      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.familyId).toBeNull();
      expect(result.current.state.familyName).toBe("");
      expect(result.current.state.connectedCalendars).toEqual([]);
      expect(result.current.state.children).toEqual([]);
      expect(result.current.state.invitations).toEqual([]);
      expect(result.current.state.isComplete).toBe(false);
    });

    it("returns all required functions", () => {
      // Arrange & Act
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Assert
      expect(typeof result.current.setFamilyName).toBe("function");
      expect(typeof result.current.setFamilyId).toBe("function");
      expect(typeof result.current.addChild).toBe("function");
      expect(typeof result.current.removeChild).toBe("function");
      expect(typeof result.current.addCalendar).toBe("function");
      expect(typeof result.current.addInvitation).toBe("function");
      expect(typeof result.current.nextStep).toBe("function");
      expect(typeof result.current.previousStep).toBe("function");
      expect(typeof result.current.skipStep).toBe("function");
      expect(typeof result.current.complete).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("Step Navigation", () => {
    it("moves to next step", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.nextStep();
      });

      // Assert
      expect(result.current.state.currentStep).toBe(2);
    });

    it("does not go beyond total steps", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
      });

      // Assert
      expect(result.current.state.currentStep).toBe(4);
    });

    it("moves to previous step", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.nextStep();
        result.current.previousStep();
      });

      // Assert
      expect(result.current.state.currentStep).toBe(1);
    });

    it("does not go below step 1", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.previousStep();
      });

      // Assert
      expect(result.current.state.currentStep).toBe(1);
    });

    it("skips current step", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.skipStep();
      });

      // Assert
      expect(result.current.state.currentStep).toBe(2);
    });
  });

  describe("Family Management", () => {
    it("sets family name", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.setFamilyName("Test Family");
      });

      // Assert
      expect(result.current.state.familyName).toBe("Test Family");
    });

    it("sets family ID", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      act(() => {
        result.current.setFamilyId("test-family-123");
      });

      // Assert
      expect(result.current.state.familyId).toBe("test-family-123");
    });
  });

  describe("Children Management", () => {
    it("adds child", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });
      const child = createMockChild({ name: "Test Child" });

      // Act
      act(() => {
        result.current.addChild(child);
      });

      // Assert
      expect(result.current.state.children).toHaveLength(1);
      expect(result.current.state.children[0]).toEqual(child);
    });

    it("removes child", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });
      const child1 = createMockChild({ id: "child-1", name: "Child 1" });
      const child2 = createMockChild({ id: "child-2", name: "Child 2" });

      act(() => {
        result.current.addChild(child1);
        result.current.addChild(child2);
      });

      // Act
      act(() => {
        result.current.removeChild("child-1");
      });

      // Assert
      expect(result.current.state.children).toHaveLength(1);
      expect(result.current.state.children[0].id).toBe("child-2");
    });
  });

  describe("Calendar Management", () => {
    it("adds calendar", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });
      const calendar = {
        id: "cal-1",
        name: "Test Calendar",
        provider: "google" as const,
      };

      // Act
      act(() => {
        result.current.addCalendar(calendar);
      });

      // Assert
      expect(result.current.state.connectedCalendars).toHaveLength(1);
      expect(result.current.state.connectedCalendars[0]).toEqual(calendar);
    });
  });

  describe("Invitation Management", () => {
    it("adds invitation", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });
      const invitation = {
        id: "inv-1",
        email: "test@example.com",
        status: "pending" as const,
        family_id: "test-family-123",
      };

      // Act
      act(() => {
        result.current.addInvitation(invitation);
      });

      // Assert
      expect(result.current.state.invitations).toHaveLength(1);
      expect(result.current.state.invitations[0]).toEqual(invitation);
    });
  });

  describe("Complete", () => {
    it("marks onboarding as complete", async () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      // Act
      await act(async () => {
        await result.current.complete();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });
    });
  });

  describe("Reset", () => {
    it("resets state to initial values", () => {
      // Arrange
      const { result } = renderHook(() => useOnboarding(), {
        wrapper: OnboardingProvider,
      });

      act(() => {
        result.current.setFamilyName("Test Family");
        result.current.setFamilyId("test-family-123");
        result.current.nextStep();
        result.current.addChild(createMockChild());
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.familyId).toBeNull();
      expect(result.current.state.familyName).toBe("");
      expect(result.current.state.children).toEqual([]);
      expect(result.current.state.isComplete).toBe(false);
    });
  });

  describe("Context Provider Requirement", () => {
    it("throws error when used outside OnboardingProvider", () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useOnboarding());
      }).toThrow("useOnboarding must be used within OnboardingProvider");
    });
  });
});

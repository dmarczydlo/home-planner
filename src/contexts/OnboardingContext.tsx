import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ChildDTO, ExternalCalendarSummaryDTO, InvitationWithInviterDTO, FamilyDTO } from "@/types";

interface OnboardingState {
  currentStep: number;
  familyId: string | null;
  familyName: string;
  connectedCalendars: ExternalCalendarSummaryDTO[];
  children: ChildDTO[];
  invitations: InvitationWithInviterDTO[];
  isComplete: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  setFamilyName: (name: string) => void;
  setFamilyId: (id: string) => void;
  addChild: (child: ChildDTO) => void;
  removeChild: (childId: string) => void;
  addCalendar: (calendar: ExternalCalendarSummaryDTO) => void;
  addInvitation: (invitation: InvitationWithInviterDTO) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  complete: () => Promise<void>;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = "onboarding_progress";
const TOTAL_STEPS = 4;

interface OnboardingProviderProps {
  children: ReactNode;
  initialStep?: number;
}

export function OnboardingProvider({ children, initialStep = 1 }: OnboardingProviderProps) {
  const loadFromStorage = useCallback((): Partial<OnboardingState> => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return {};
      }

      return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to load onboarding progress:", error);
      return {};
    }
  }, []);

  const saveToStorage = useCallback((state: OnboardingState) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const { currentStep, familyName, children, invitations, connectedCalendars, familyId } = state;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep,
          familyName,
          children,
          invitations,
          connectedCalendars,
          familyId,
        })
      );
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
    }
  }, []);

  const savedState = loadFromStorage();
  const [state, setState] = useState<OnboardingState>({
    currentStep: savedState.currentStep || initialStep,
    familyId: savedState.familyId || null,
    familyName: savedState.familyName || "",
    connectedCalendars: savedState.connectedCalendars || [],
    children: savedState.children || [],
    invitations: savedState.invitations || [],
    isComplete: savedState.isComplete || false,
  });

  const updateState = useCallback(
    (updates: Partial<OnboardingState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const setFamilyName = useCallback(
    (name: string) => {
      updateState({ familyName: name });
    },
    [updateState]
  );

  const setFamilyId = useCallback(
    (id: string) => {
      updateState({ familyId: id });
    },
    [updateState]
  );

  const addChild = useCallback(
    (child: ChildDTO) => {
      setState((prev) => {
        const newState = {
          ...prev,
          children: [...prev.children, child],
        };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const removeChild = useCallback(
    (childId: string) => {
      setState((prev) => {
        const newState = {
          ...prev,
          children: prev.children.filter((c) => c.id !== childId),
        };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const addCalendar = useCallback(
    (calendar: ExternalCalendarSummaryDTO) => {
      setState((prev) => {
        const newState = {
          ...prev,
          connectedCalendars: [...prev.connectedCalendars, calendar],
        };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const addInvitation = useCallback(
    (invitation: InvitationWithInviterDTO) => {
      setState((prev) => {
        const newState = {
          ...prev,
          invitations: [...prev.invitations, invitation],
        };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep >= TOTAL_STEPS) {
        return prev;
      }

      const newState = {
        ...prev,
        currentStep: prev.currentStep + 1,
      };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const previousStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep <= 1) {
        return prev;
      }

      const newState = {
        ...prev,
        currentStep: prev.currentStep - 1,
      };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const skipStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const complete = useCallback(async () => {
    updateState({ isComplete: true });

    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/calendar/week";
  }, [updateState]);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }

    setState({
      currentStep: 1,
      familyId: null,
      familyName: "",
      connectedCalendars: [],
      children: [],
      invitations: [],
      isComplete: false,
    });
  }, []);

  const value: OnboardingContextType = {
    state,
    setFamilyName,
    setFamilyId,
    addChild,
    removeChild,
    addCalendar,
    addInvitation,
    nextStep,
    previousStep,
    skipStep,
    complete,
    reset,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }

  return context;
}

import { useState, useEffect } from "react";
import { AuthProviderWrapper } from "@/components/auth/AuthProviderWrapper";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingWizard } from "./OnboardingWizard";
import { WelcomeStep } from "./WelcomeStep";
import { ConnectCalendarStep } from "./ConnectCalendarStep";
import { AddChildrenStep } from "./AddChildrenStep";
import { InviteMembersStep } from "./InviteMembersStep";

function OnboardingContent() {
  const { state } = useOnboarding();
  const [displayStep, setDisplayStep] = useState(state.currentStep);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (displayStep !== state.currentStep) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayStep(state.currentStep);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.currentStep, displayStep]);

  const renderStep = () => {
    switch (displayStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <ConnectCalendarStep />;
      case 3:
        return <AddChildrenStep />;
      case 4:
        return <InviteMembersStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <OnboardingWizard>
      <div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        {renderStep()}
      </div>
    </OnboardingWizard>
  );
}

export function OnboardingPage() {
  return (
    <AuthProviderWrapper>
      <OnboardingProvider>
        <OnboardingContent />
      </OnboardingProvider>
    </AuthProviderWrapper>
  );
}

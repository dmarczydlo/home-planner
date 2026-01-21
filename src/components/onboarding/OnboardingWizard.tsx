import { type ReactNode } from "react";
import { ProgressIndicator } from "./ProgressIndicator";
import { StepActions } from "./StepActions";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  children: ReactNode;
  className?: string;
  onNext?: () => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  showSkip?: boolean;
}

const TOTAL_STEPS = 4;

export function OnboardingWizard({
  children,
  className,
  onNext,
  onComplete,
  isNextDisabled = false,
  isNextLoading = false,
  showSkip = true,
}: OnboardingWizardProps) {
  const { state, nextStep, previousStep, skipStep, complete } = useOnboarding();

  const handleNext = async () => {
    if (state.currentStep === 1) {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form) {
        nextStep();
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
        return;
      }

      nextStep();
      return;
    }

    if (onNext) {
      try {
        await onNext();
      } catch (error) {
        console.error("Error in handleNext:", error);
        return;
      }
    }

    nextStep();
  };

  const handleComplete = async () => {
    if (onComplete) {
      await onComplete();
    }

    await complete();
  };

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        "bg-gradient-to-br from-primary/5 via-background to-accent/5",
        className
      )}
      role="region"
      aria-label="Onboarding wizard"
    >
      <div className="flex-1 flex flex-col mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <ProgressIndicator currentStep={state.currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        <div className="flex-1 bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          <div className="space-y-6" role="group" aria-labelledby="step-content">
            {children}
          </div>
        </div>

        <div className="mt-8">
          <StepActions
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onBack={previousStep}
            onNext={handleNext}
            onSkip={skipStep}
            onComplete={handleComplete}
            isNextDisabled={isNextDisabled}
            isNextLoading={isNextLoading}
            showSkip={showSkip}
          />
        </div>
      </div>
    </div>
  );
}

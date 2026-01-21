import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepActionsProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  onComplete?: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  showSkip?: boolean;
  className?: string;
}

export function StepActions({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  onComplete,
  isNextDisabled = false,
  isNextLoading = false,
  showSkip = true,
  className,
}: StepActionsProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const showBack = !isFirstStep && onBack;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:justify-between",
        "sticky bottom-0 bg-background border-t pt-4 pb-safe",
        className
      )}
    >
      <div className="flex gap-2">
        {showBack && (
          <Button variant="outline" onClick={onBack} className="min-h-[44px] flex-1 sm:flex-initial">
            Back
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {showSkip && !isLastStep && onSkip && (
          <Button variant="ghost" onClick={onSkip} className="min-h-[44px]">
            Skip for now
          </Button>
        )}
        {isLastStep ? (
          <Button
            onClick={onComplete}
            disabled={isNextDisabled || isNextLoading}
            className="min-h-[44px] flex-1 sm:flex-initial"
          >
            {isNextLoading ? "Completing..." : "Complete Setup"}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={isNextDisabled || isNextLoading}
            className="min-h-[44px] flex-1 sm:flex-initial"
          >
            {isNextLoading ? "Loading..." : "Next"}
          </Button>
        )}
      </div>
    </div>
  );
}

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ currentStep, totalSteps, className }: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;
  const stepLabels = ["Welcome", "Calendar", "Children", "Invite"];

  return (
    <div className={cn("w-full space-y-2", className)} role="region" aria-label="Onboarding progress">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-muted-foreground">{stepLabels[currentStep - 1]}</span>
      </div>
      <Progress value={progress} className="h-2" aria-hidden="true" />
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            className={cn(
              "transition-colors",
              index + 1 <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}


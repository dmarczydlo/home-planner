import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ currentStep, totalSteps, className }: ProgressIndicatorProps) {
  const stepLabels = ["Welcome", "Calendar", "Children", "Invite"];

  return (
    <div className={cn("w-full", className)} role="region" aria-label="Onboarding progress">
      <div className="flex items-center justify-between gap-2">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={label} className="flex-1">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isCompleted && "bg-success text-success-foreground shadow-md",
                    isCurrent && "bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/20",
                    isUpcoming && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors text-center",
                    (isCompleted || isCurrent) && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div className="relative h-0.5 mt-[-26px] ml-[calc(50%+20px)] w-[calc(100%-40px)]">
                  <div className="absolute inset-0 bg-muted" />
                  <div
                    className={cn(
                      "absolute inset-0 bg-success transition-all duration-300",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

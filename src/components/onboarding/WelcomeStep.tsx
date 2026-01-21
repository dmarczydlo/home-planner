import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useFamilyApi } from "@/hooks/useFamilyApi";
import { createFamilyCommandSchema, formatZodErrors } from "@/types";
import { cn } from "@/lib/utils";

interface WelcomeStepProps {
  className?: string;
}

export function WelcomeStep({ className }: WelcomeStepProps) {
  const { state, setFamilyName, setFamilyId, nextStep } = useOnboarding();
  const { createFamily, isCreating, error: apiError } = useFamilyApi();
  const [familyName, setLocalFamilyName] = useState(state.familyName);
  const [error, setError] = useState<string | null>(null);
  const [shouldProceed, setShouldProceed] = useState(false);

  useEffect(() => {
    if (!shouldProceed) {
      return;
    }

    if (!state.familyId) {
      return;
    }

    if (isCreating) {
      return;
    }

    if (error || apiError) {
      return;
    }

    setShouldProceed(false);
    nextStep();
  }, [shouldProceed, state.familyId, isCreating, error, apiError, nextStep]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = createFamilyCommandSchema.safeParse({ name: familyName });
    if (!validation.success) {
      const errors = formatZodErrors(validation.error);
      const firstError = errors[0];
      setError(firstError ? firstError.message : "Validation failed");
      return;
    }

    try {
      setFamilyName(validation.data.name);

      const response = await createFamily(validation.data);
      setFamilyId(response.id);
      setShouldProceed(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create family. Please try again.";
      setError(errorMessage);
    }
  };

  const displayError = error || apiError;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" id="step-title">
          Welcome to Home Planner!
        </h1>
        <p className="text-muted-foreground">Let&apos;s set up your family calendar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="family-name">Family Name</Label>
          <Input
            id="family-name"
            type="text"
            value={familyName}
            onChange={(e) => {
              setLocalFamilyName(e.target.value);
              setError(null);
            }}
            placeholder="Enter your family name"
            className="min-h-[48px] text-base"
            disabled={isCreating}
            aria-invalid={displayError ? "true" : "false"}
            aria-describedby={displayError ? "family-name-error" : undefined}
            maxLength={100}
            required
          />
          {displayError && (
            <p id="family-name-error" className="text-sm text-destructive" role="alert">
              {displayError}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{familyName.length}/100 characters</p>
        </div>
        <button type="submit" className="sr-only" aria-hidden="true">
          Submit
        </button>
      </form>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useChildApi } from "@/hooks/useChildApi";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { createChildCommandSchema, formatZodErrors } from "@/types";

interface ChildFormProps {
  familyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChildAdded?: () => void;
}

export function ChildForm({ familyId, open, onOpenChange, onChildAdded }: ChildFormProps) {
  const { createChild, isCreating, error: apiError } = useChildApi();
  const { addChild } = useOnboarding();
  const [childName, setChildName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = createChildCommandSchema.safeParse({ name: childName });
    if (!validation.success) {
      const errors = formatZodErrors(validation.error);
      const firstError = errors[0];
      setError(firstError ? firstError.message : "Validation failed");
      return;
    }

    try {
      const child = await createChild(familyId, validation.data);
      addChild(child);
      setChildName("");
      onOpenChange(false);
      onChildAdded?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add child. Please try again.";
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setChildName("");
      setError(null);
      onOpenChange(false);
    }
  };

  const displayError = error || apiError;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Add Child</SheetTitle>
          <SheetDescription>Add a child to your family calendar.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="child-name">Name</Label>
            <Input
              id="child-name"
              type="text"
              value={childName}
              onChange={(e) => {
                setChildName(e.target.value);
                setError(null);
              }}
              placeholder="Enter child's name"
              className="min-h-[48px] text-base"
              disabled={isCreating}
              aria-invalid={displayError ? "true" : "false"}
              aria-describedby={displayError ? "child-name-error" : undefined}
              maxLength={100}
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            {displayError && (
              <p id="child-name-error" className="text-sm text-destructive" role="alert">
                {displayError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{childName.length}/100 characters</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating} className="min-h-[44px]">
              {isCreating ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

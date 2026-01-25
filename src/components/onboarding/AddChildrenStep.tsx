import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChildCard } from "./ChildCard";
import { ChildForm } from "./ChildForm";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";

interface AddChildrenStepProps {
  className?: string;
}

export function AddChildrenStep({ className }: AddChildrenStepProps) {
  const { state, removeChild } = useOnboarding();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleChildAdded = () => {
    setIsFormOpen(false);
  };

  if (!state.familyId) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" id="step-title">
            Add Your Children
          </h1>
          <p className="text-muted-foreground">Please complete the previous step first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" id="step-title">
          Add Your Children
        </h1>
        <p className="text-muted-foreground">Add children to your family calendar to track their events.</p>
      </div>

      {state.children.length > 0 && (
        <div className="space-y-3">
          {state.children.map((child) => (
            <ChildCard key={child.id} child={child} onRemove={removeChild} />
          ))}
        </div>
      )}

      <Button
        onClick={() => setIsFormOpen(true)}
        variant="outline"
        className="w-full min-h-[48px]"
        aria-label="Add child"
      >
        + Add Child
      </Button>

      <ChildForm
        familyId={state.familyId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onChildAdded={handleChildAdded}
      />
    </div>
  );
}

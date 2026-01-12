import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChildApi } from "@/hooks/useChildApi";
import type { CreateChildCommand, ChildDTO } from "@/types";

interface AddChildFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  editChild?: ChildDTO | null;
  onSuccess?: () => void;
}

export function AddChildForm({ open, onOpenChange, familyId, editChild, onSuccess }: AddChildFormProps) {
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { createChild, isCreating, error } = useChildApi();

  const isEditMode = !!editChild;

  useEffect(() => {
    if (editChild) {
      setName(editChild.name);
    } else {
      setName("");
    }
    setValidationError(null);
  }, [editChild, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Child name is required");
      return;
    }

    if (name.trim().length > 100) {
      setValidationError("Child name must be less than 100 characters");
      return;
    }

    try {
      const command: CreateChildCommand = {
        name: name.trim(),
      };

      if (isEditMode) {
        const response = await fetch(`/api/families/${familyId}/children/${editChild.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to update child");
        }
      } else {
        await createChild(familyId, command);
      }

      setName("");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? "update" : "add"} child:`, err);
    }
  };

  const handleCancel = () => {
    setName("");
    setValidationError(null);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Edit Child" : "Add Child"}</SheetTitle>
            <SheetDescription>
              {isEditMode ? "Update the child's name" : "Enter the name of your child to add them to the family"}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Child's name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError(null);
                }}
                disabled={isCreating}
                autoFocus
                maxLength={100}
                aria-required="true"
                aria-invalid={!!(validationError || error)}
                aria-describedby={validationError || error ? "name-error" : undefined}
              />
              {(validationError || error) && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {validationError || error}
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (isEditMode ? "Updating..." : "Adding...") : isEditMode ? "Update" : "Add"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

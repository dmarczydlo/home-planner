import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvitationApi } from "@/hooks/useInvitationApi";
import type { CreateInvitationCommand } from "@/types";

interface InviteMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  onSuccess?: () => void;
}

export function InviteMemberForm({ open, onOpenChange, familyId, onSuccess }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { createInvitation, isCreating, error } = useInvitationApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email.trim()) {
      setValidationError("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    try {
      const command: CreateInvitationCommand = {
        invitee_email: email.trim(),
      };

      await createInvitation(familyId, command);

      setEmail("");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to send invitation:", err);
    }
  };

  const handleCancel = () => {
    setEmail("");
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
            <SheetTitle>Invite Family Member</SheetTitle>
            <SheetDescription>
              Enter the email address of the person you want to invite. They will receive an email with instructions to
              join your family.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(null);
                }}
                disabled={isCreating}
                autoFocus
                aria-required="true"
                aria-invalid={!!(validationError || error)}
                aria-describedby={validationError || error ? "email-error" : undefined}
              />
              {(validationError || error) && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
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
              {isCreating ? "Sending..." : "Send Invitation"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

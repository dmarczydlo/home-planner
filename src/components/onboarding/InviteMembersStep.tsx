import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InvitationCard } from "./InvitationCard";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useInvitationApi } from "@/hooks/useInvitationApi";
import { useAuth } from "@/hooks/useAuth";
import { createInvitationCommandSchema, formatZodErrors, type InvitationWithInviterDTO } from "@/types";
import { cn } from "@/lib/utils";

interface InviteMembersStepProps {
  className?: string;
}

export function InviteMembersStep({ className }: InviteMembersStepProps) {
  const { state, addInvitation } = useOnboarding();
  const { createInvitation, isCreating, error: apiError } = useInvitationApi();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!state.familyId) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" id="step-title">
            Invite Family Members
          </h1>
          <p className="text-muted-foreground">Please complete the previous step first.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!state.familyId) {
      setError("Family ID is missing. Please complete the previous step first.");
      return;
    }

    const validation = createInvitationCommandSchema.safeParse({ invitee_email: email });
    if (!validation.success) {
      const errors = formatZodErrors(validation.error);
      const firstError = errors[0];
      setError(firstError ? firstError.message : "Validation failed");
      return;
    }

    try {
      const response = await createInvitation(state.familyId, validation.data);
      const invitation: InvitationWithInviterDTO = {
        id: response.id,
        family_id: response.family_id,
        invited_by: {
          id: response.invited_by,
          full_name: user?.full_name || null,
        },
        invitee_email: response.invitee_email,
        status: response.status,
        expires_at: response.expires_at,
        created_at: response.created_at,
      };
      addInvitation(invitation);
      setEmail("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send invitation. Please try again.";
      setError(errorMessage);
    }
  };

  const displayError = error || apiError;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" id="step-title">
          Invite Family Members
        </h1>
        <p className="text-muted-foreground">Invite family members to join your calendar.</p>
      </div>

      {state.invitations.length > 0 && (
        <div className="space-y-3">
          {state.invitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <div className="flex gap-2">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Enter email address"
              className="min-h-[48px] text-base flex-1"
              disabled={isCreating}
              aria-invalid={displayError ? "true" : "false"}
              aria-describedby={displayError ? "invite-email-error" : undefined}
              required
            />
            <Button type="submit" disabled={isCreating} className="min-h-[48px]">
              {isCreating ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
          {displayError && (
            <p id="invite-email-error" className="text-sm text-destructive" role="alert">
              {displayError}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

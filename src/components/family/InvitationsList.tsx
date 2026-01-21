import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationCard } from "./InvitationCard";
import type { InvitationWithInviterDTO } from "@/types";

interface InvitationsListProps {
  invitations: InvitationWithInviterDTO[];
  isAdmin: boolean;
  onCancel?: (invitationId: string) => Promise<void>;
}

export function InvitationsList({ invitations, isAdmin, onCancel }: InvitationsListProps) {
  const pendingCount = invitations.filter((inv) => inv.status === "pending").length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Pending Invitations {pendingCount > 0 && `(${pendingCount})`}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending invitations</p>
            {isAdmin && <p className="text-xs mt-2">Use the &quot;Invite&quot; button to add new members</p>}
          </div>
        ) : (
          <div role="list" aria-label="Pending invitations" className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} role="listitem">
                <InvitationCard invitation={invitation} onCancel={onCancel} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

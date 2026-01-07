import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvitationWithInviterDTO } from "@/types";
import { isPendingInvitation } from "@/types";

interface InvitationCardProps {
  invitation: InvitationWithInviterDTO;
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const isPending = isPendingInvitation(invitation);
  const isExpired = invitation.status === "expired";

  return (
    <Card className="min-h-[80px]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{invitation.invitee_email}</h3>
              <Badge variant={isPending ? "default" : isExpired ? "destructive" : "secondary"} className="text-xs">
                {invitation.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Invited by {invitation.invited_by.full_name || "Unknown"}</p>
            {isPending && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

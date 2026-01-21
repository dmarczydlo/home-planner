import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { format } from "date-fns";
import { isPendingInvitation } from "@/types";
import type { InvitationWithInviterDTO } from "@/types";

interface InvitationCardProps {
  invitation: InvitationWithInviterDTO;
  onCancel?: (invitationId: string) => Promise<void>;
  isAdmin?: boolean;
}

export function InvitationCard({ invitation, onCancel, isAdmin = false }: InvitationCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPending = isPendingInvitation(invitation);
  const isExpired = invitation.status === "expired";

  const expiryDate = format(new Date(invitation.expires_at), "MMM d, yyyy");
  const createdDate = format(new Date(invitation.created_at), "MMM d, yyyy");

  const handleCancel = async () => {
    if (!onCancel) return;

    setIsProcessing(true);
    try {
      await onCancel(invitation.id);
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getBadgeVariant = () => {
    if (isPending) return "default";
    if (isExpired) return "destructive";
    return "secondary";
  };

  return (
    <>
      <Card className="min-h-[80px]">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-base truncate">{invitation.invitee_email}</h3>
                <Badge variant={getBadgeVariant()} className="text-xs shrink-0">
                  {invitation.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Invited by {invitation.invited_by.full_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isPending ? `Expires ${expiryDate}` : `Sent ${createdDate}`}
              </p>
            </div>
            {isAdmin && isPending && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="h-9 w-9 p-0 shrink-0"
                aria-label={`Cancel invitation for ${invitation.invitee_email}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for {invitation.invitee_email}? They will no longer be able
              to use this link to join the family.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isProcessing} className="bg-destructive">
              {isProcessing ? "Canceling..." : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

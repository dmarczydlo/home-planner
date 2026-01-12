import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical } from "lucide-react";
import { format } from "date-fns";
import type { FamilyMemberDTO } from "@/types";

interface MemberCardProps {
  member: FamilyMemberDTO;
  isAdmin: boolean;
  currentUserId: string;
  onRemove?: (userId: string) => Promise<void>;
  onRoleChange?: (userId: string, role: "admin" | "member") => Promise<void>;
}

export function MemberCard({ member, isAdmin, currentUserId, onRemove, onRoleChange }: MemberCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;
  const canManage = isAdmin && !isCurrentUser;
  const joinedDate = format(new Date(member.joined_at), "MMM d, yyyy");
  const initials = member.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const handleRemove = async () => {
    if (!onRemove) return;

    setIsProcessing(true);
    try {
      await onRemove(member.user_id);
      setShowRemoveDialog(false);
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = async () => {
    if (!onRoleChange) return;

    const newRole = member.role === "admin" ? "member" : "admin";
    setIsProcessing(true);
    try {
      await onRoleChange(member.user_id, newRole);
      setShowRoleChangeDialog(false);
    } catch (error) {
      console.error("Failed to change role:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url || undefined} alt={member.full_name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{member.full_name || "Unknown User"}</h3>
              <Badge variant={member.role === "admin" ? "default" : "secondary"} className="text-xs shrink-0">
                {member.role}
              </Badge>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs shrink-0">
                  You
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Joined {joinedDate}</p>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  aria-label={`Actions for ${member.full_name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowRoleChangeDialog(true)}>
                  {member.role === "admin" ? "Remove admin role" : "Make admin"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowRemoveDialog(true)} className="text-destructive">
                  Remove from family
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {member.full_name} from the family? They will lose access to all family
              events and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isProcessing} className="bg-destructive">
              {isProcessing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change member role</AlertDialogTitle>
            <AlertDialogDescription>
              {member.role === "admin"
                ? `Remove admin privileges from ${member.full_name}? They will become a regular member.`
                : `Make ${member.full_name} an admin? They will be able to manage the family, invite members, and change roles.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={isProcessing}>
              {isProcessing ? "Changing..." : "Change role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

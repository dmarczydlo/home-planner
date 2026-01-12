import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberCard } from "./MemberCard";
import { UserPlus } from "lucide-react";
import type { FamilyMemberDTO } from "@/types";

interface MembersListProps {
  members: FamilyMemberDTO[];
  currentUserId: string;
  isAdmin: boolean;
  onInviteClick?: () => void;
  onRemoveMember?: (userId: string) => Promise<void>;
  onRoleChange?: (userId: string, role: "admin" | "member") => Promise<void>;
}

export function MembersList({
  members,
  currentUserId,
  isAdmin,
  onInviteClick,
  onRemoveMember,
  onRoleChange,
}: MembersListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Members ({members.length})</CardTitle>
        {isAdmin && onInviteClick && (
          <Button onClick={onInviteClick} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No members yet</p>
          </div>
        ) : (
          <div role="list" aria-label="Family members" className="space-y-3">
            {members.map((member) => (
              <div key={member.user_id} role="listitem">
                <MemberCard
                  member={member}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  onRemove={onRemoveMember}
                  onRoleChange={onRoleChange}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

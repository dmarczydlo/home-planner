import { useState, useEffect } from "react";
import { FamilyHeader } from "./FamilyHeader";
import { MembersList } from "./MembersList";
import { ChildrenList } from "./ChildrenList";
import { InvitationsList } from "./InvitationsList";
import { InviteMemberForm } from "./InviteMemberForm";
import { AddChildForm } from "./AddChildForm";
import { useFamilyData } from "@/hooks/useFamilyData";
import { useAuth } from "@/hooks/useAuth";
import type { ChildDTO } from "@/types";

interface FamilyOverviewProps {
  familyId: string;
}

export function FamilyOverview({ familyId }: FamilyOverviewProps) {
  const { user } = useAuth();
  const {
    familyDetails,
    members,
    children,
    invitations,
    isLoading,
    error,
    refreshFamily,
    refreshInvitations,
    refreshChildren,
    removeMember,
    removeChild,
    cancelInvitation,
    updateMemberRole,
  } = useFamilyData(familyId);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildDTO | null>(null);

  const currentMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    if (editingChild) {
      setShowChildForm(true);
    }
  }, [editingChild]);

  const handleInviteSuccess = () => {
    refreshInvitations();
  };

  const handleChildSuccess = () => {
    setEditingChild(null);
    refreshChildren();
  };

  const handleEditChild = (child: ChildDTO) => {
    setEditingChild(child);
  };

  const handleChildFormClose = (open: boolean) => {
    setShowChildForm(open);
    if (!open) {
      setEditingChild(null);
    }
  };

  if (isLoading && !familyDetails) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !familyDetails) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Failed to load family</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button onClick={() => refreshFamily()} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!familyDetails || !user) {
    return null;
  }

  return (
    <>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <FamilyHeader family={familyDetails} />

          <MembersList
            members={members}
            currentUserId={user.id}
            isAdmin={isAdmin}
            onInviteClick={() => setShowInviteForm(true)}
            onRemoveMember={removeMember}
            onRoleChange={updateMemberRole}
          />

          <ChildrenList
            children={children}
            onAddClick={() => setShowChildForm(true)}
            onEdit={handleEditChild}
            onRemove={removeChild}
          />

          {invitations.length > 0 && (
            <InvitationsList invitations={invitations} isAdmin={isAdmin} onCancel={cancelInvitation} />
          )}
        </div>
      </div>

      {isAdmin && (
        <InviteMemberForm
          open={showInviteForm}
          onOpenChange={setShowInviteForm}
          familyId={familyId}
          onSuccess={handleInviteSuccess}
        />
      )}

      <AddChildForm
        open={showChildForm}
        onOpenChange={handleChildFormClose}
        familyId={familyId}
        editChild={editingChild}
        onSuccess={handleChildSuccess}
      />
    </>
  );
}

import { FamilyMembershipCard } from "./FamilyMembershipCard";
import type { UserFamilyMembershipDTO } from "@/types";

interface FamilyMembershipsProps {
  families: UserFamilyMembershipDTO[];
  currentFamilyId: string | null;
  onSwitchFamily: (familyId: string) => void;
}

export function FamilyMemberships({ families, currentFamilyId, onSwitchFamily }: FamilyMembershipsProps) {
  if (families.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No family memberships</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {families.map((family) => (
        <FamilyMembershipCard
          key={family.family_id}
          family={family}
          isCurrent={family.family_id === currentFamilyId}
          onSwitch={families.length > 1 ? () => onSwitchFamily(family.family_id) : undefined}
        />
      ))}
    </div>
  );
}

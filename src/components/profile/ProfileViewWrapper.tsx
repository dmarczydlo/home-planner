import { AuthProviderWrapper } from "@/components/auth/AuthProviderWrapper";
import { ProfileView } from "./ProfileView";
import { useState } from "react";

interface ProfileViewWrapperProps {
  currentFamilyId: string | null;
}

function ProfileViewContent({ currentFamilyId }: ProfileViewWrapperProps) {
  const [familyId, setFamilyId] = useState<string | null>(currentFamilyId);

  const handleSwitchFamily = (newFamilyId: string) => {
    setFamilyId(newFamilyId);
    window.location.href = `/calendar/week?family=${newFamilyId}`;
  };

  return <ProfileView currentFamilyId={familyId} onSwitchFamily={handleSwitchFamily} />;
}

export function ProfileViewWrapper({ currentFamilyId }: ProfileViewWrapperProps) {
  return (
    <AuthProviderWrapper>
      <ProfileViewContent currentFamilyId={currentFamilyId} />
    </AuthProviderWrapper>
  );
}

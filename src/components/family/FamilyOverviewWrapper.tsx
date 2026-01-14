import { AuthProviderWrapper } from "@/components/auth/AuthProviderWrapper";
import { FamilyOverview } from "./FamilyOverview";

interface FamilyOverviewWrapperProps {
  familyId: string;
}

export function FamilyOverviewWrapper({ familyId }: FamilyOverviewWrapperProps) {
  return (
    <AuthProviderWrapper>
      <FamilyOverview familyId={familyId} />
    </AuthProviderWrapper>
  );
}

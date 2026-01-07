import { AuthProviderWrapper } from "@/components/auth/AuthProviderWrapper";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingWizard } from "./OnboardingWizard";
import { WelcomeStep } from "./WelcomeStep";

export function OnboardingPage() {
  return (
    <AuthProviderWrapper>
      <OnboardingProvider>
        <OnboardingWizard>
          <WelcomeStep />
        </OnboardingWizard>
      </OnboardingProvider>
    </AuthProviderWrapper>
  );
}

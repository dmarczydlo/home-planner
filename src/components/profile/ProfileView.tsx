import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { EditProfileForm } from "./EditProfileForm";
import { FamilyMemberships } from "./FamilyMemberships";
import { LogoutButton } from "./LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";

interface ProfileViewProps {
  currentFamilyId: string | null;
  onSwitchFamily?: (familyId: string) => void;
}

export function ProfileView({ currentFamilyId, onSwitchFamily }: ProfileViewProps) {
  const { user, refreshUser } = useAuth();
  const { updateProfile } = useUpdateProfile();
  const [showEditForm, setShowEditForm] = useState(false);
  const [email, setEmail] = useState<string>("Loading...");

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const supabase = createSupabaseClientForAuth();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setEmail(session?.user?.email || "No email");
      } catch {
        setEmail("No email");
      }
    };
    fetchEmail();
  }, []);

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSave = async (fullName: string | null, avatarUrl: string | null) => {
    await updateProfile({ full_name: fullName, avatar_url: avatarUrl });
    await refreshUser();
  };

  const handleSwitchFamily = (familyId: string) => {
    if (onSwitchFamily) {
      onSwitchFamily(familyId);
    } else {
      window.location.href = `/calendar/week?family=${familyId}`;
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 bg-background flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="glass-effect border-b border-primary/20 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="md:hidden" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="glass-effect rounded-lg border border-primary/20 backdrop-blur-xl p-6">
            <div className="flex flex-col items-center mb-6">
              <ProfileAvatar avatarUrl={user.avatar_url} fullName={user.full_name} onEdit={handleEdit} />
            </div>

            <Separator className="my-6" />

            <ProfileInfo fullName={user.full_name} email={email} onEdit={handleEdit} />
          </div>

          {user.families && user.families.length > 0 && (
            <div className="glass-effect rounded-lg border border-primary/20 backdrop-blur-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Family Memberships</h2>
              <FamilyMemberships
                families={user.families}
                currentFamilyId={currentFamilyId}
                onSwitchFamily={handleSwitchFamily}
              />
            </div>
          )}

          <div className="glass-effect rounded-lg border border-primary/20 backdrop-blur-xl p-6">
            <LogoutButton />
          </div>
        </div>
      </main>

      <EditProfileForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        initialFullName={user.full_name}
        initialAvatarUrl={user.avatar_url}
        onSave={handleSave}
      />
    </div>
  );
}

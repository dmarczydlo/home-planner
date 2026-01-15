import { useEffect, useState } from "react";
import { Loader2, User as UserIcon, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { UserProfileDTO } from "@/types";

export function AccountTab() {
  const [userProfile, setUserProfile] = useState<UserProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClientForAuth();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/users/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load user profile");
      }

      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load user profile";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = createSupabaseClientForAuth();
      await supabase.auth.signOut();
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Failed to logout:", err);
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAdminFamilies = () => {
    if (!userProfile?.families) return [];
    return userProfile.families.filter((f) => f.role === "admin");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!userProfile) {
    return null;
  }

  const adminFamilies = getAdminFamilies();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and admin settings
        </p>
      </div>

      <Card className="glass-effect border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Information</CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name || "User"} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials(userProfile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {userProfile.full_name || "Anonymous User"}
              </h3>
              <p className="text-sm text-muted-foreground">ID: {userProfile.id}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Account Details</p>
            <div className="grid gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="text-foreground font-medium">{userProfile.full_name || "Not set"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="text-foreground font-medium">
                  {userProfile.updated_at
                    ? new Date(userProfile.updated_at).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {adminFamilies.length > 0 && (
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">Admin Families</CardTitle>
            <CardDescription>Families where you have admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adminFamilies.map((family) => (
                <div
                  key={family.family_id}
                  className="flex items-center justify-between p-3 glass-effect rounded-lg border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{family.family_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(family.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/family/overview?family=${family.family_id}`}>View</a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-effect border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Account Actions</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

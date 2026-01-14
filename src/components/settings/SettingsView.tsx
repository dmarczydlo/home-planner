import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalCalendarsTab } from "./ExternalCalendarsTab";
import { PreferencesTab } from "./PreferencesTab";
import { AccountTab } from "./AccountTab";

interface SettingsViewProps {
  familyId: string;
  isAdmin: boolean;
  initialTab?: "calendars" | "preferences" | "account";
}

export function SettingsView({ familyId, isAdmin, initialTab = "calendars" }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="md:hidden"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto md:mx-0">
            <TabsTrigger value="calendars">Calendars</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            {isAdmin && <TabsTrigger value="account">Account</TabsTrigger>}
          </TabsList>

          <TabsContent value="calendars" className="space-y-4">
            <ExternalCalendarsTab familyId={familyId} />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <PreferencesTab familyId={familyId} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="account" className="space-y-4">
              <AccountTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

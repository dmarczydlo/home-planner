import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface PreferencesTabProps {
  familyId: string;
}

export function PreferencesTab({ familyId }: PreferencesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your app experience
        </p>
      </div>

      <Card className="glass-effect border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">View Preferences</CardTitle>
          <CardDescription>Customize how you view and interact with your calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="default-view">Default Calendar View</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which view to show when opening the calendar
                </p>
              </div>
              <Select defaultValue="week">
                <SelectTrigger id="default-view" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="date-format">Date Format</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how dates are displayed
                </p>
              </div>
              <Select defaultValue="MM/DD/YYYY">
                <SelectTrigger id="date-format" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="time-format">Time Format</Label>
                <p className="text-sm text-muted-foreground">
                  Choose 12-hour or 24-hour time format
                </p>
              </div>
              <Select defaultValue="12">
                <SelectTrigger id="time-format" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour</SelectItem>
                  <SelectItem value="24">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="week-start">Week Starts On</Label>
                <p className="text-sm text-muted-foreground">
                  Choose the first day of the week
                </p>
              </div>
              <Select defaultValue="sunday">
                <SelectTrigger id="week-start" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="monday">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Notification Preferences</CardTitle>
          <CardDescription>Control when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="event-reminders">Event Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications before events start
              </p>
            </div>
            <Switch id="event-reminders" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="conflict-alerts">Conflict Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when events conflict
              </p>
            </div>
            <Switch id="conflict-alerts" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="invitation-notifications">Invitation Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for family invitations
              </p>
            </div>
            <Switch id="invitation-notifications" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sync-notifications">Sync Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when calendars sync
              </p>
            </div>
            <Switch id="sync-notifications" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

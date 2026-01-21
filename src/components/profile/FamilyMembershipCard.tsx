import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import type { UserFamilyMembershipDTO } from "@/types";

interface FamilyMembershipCardProps {
  family: UserFamilyMembershipDTO;
  isCurrent: boolean;
  onSwitch?: () => void;
}

export function FamilyMembershipCard({ family, isCurrent, onSwitch }: FamilyMembershipCardProps) {
  return (
    <Card className={isCurrent ? "border-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{family.family_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={family.role === "admin" ? "default" : "secondary"}>
                  {family.role === "admin" ? "Admin" : "Member"}
                </Badge>
                {isCurrent && (
                  <Badge variant="outline" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {new Date(family.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {!isCurrent && onSwitch && (
            <Button variant="outline" size="sm" onClick={onSwitch}>
              Switch
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ProfileInfoProps {
  fullName: string | null;
  email: string;
  onEdit: () => void;
}

export function ProfileInfo({ fullName, email, onEdit }: ProfileInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="block text-sm font-medium text-muted-foreground mb-1">Full Name</div>
        <div className="flex items-center justify-between">
          <p className="text-base text-foreground font-medium">{fullName || "Not set"}</p>
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit name">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div>
        <div className="block text-sm font-medium text-muted-foreground mb-1">Email</div>
        <p className="text-base text-foreground font-medium">{email}</p>
        <p className="text-xs text-muted-foreground mt-1">(from Google account)</p>
      </div>
    </div>
  );
}

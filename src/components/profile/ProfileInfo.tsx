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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name
        </label>
        <div className="flex items-center justify-between">
          <p className="text-base text-gray-900 dark:text-white">
            {fullName || "Not set"}
          </p>
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit name">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <p className="text-base text-gray-900 dark:text-white">{email}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          (from Google account)
        </p>
      </div>
    </div>
  );
}

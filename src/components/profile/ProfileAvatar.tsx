import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/profile/avatarUtils";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  fullName: string | null;
  onEdit: () => void;
}

export function ProfileAvatar({ avatarUrl, fullName, onEdit }: ProfileAvatarProps) {
  const initials = getInitials(fullName);
  const colorClass = getAvatarColor(fullName);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-700">
          <AvatarImage src={avatarUrl || undefined} alt={fullName || "User"} />
          <AvatarFallback className={`${colorClass} text-white text-2xl font-semibold`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
          onClick={onEdit}
          aria-label="Edit avatar"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

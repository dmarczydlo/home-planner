import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createSupabaseClientForAuth } from "@/lib/auth/supabaseAuth";
import type { FamilyMemberDTO, ChildDTO } from "@/types";

interface Participant {
  id: string;
  type: "user" | "child";
  name: string;
  avatarUrl?: string | null;
}

interface ParticipantSelectorProps {
  familyId: string;
  selectedParticipants: { id: string; type: "user" | "child" }[];
  onSelectionChange: (participants: { id: string; type: "user" | "child" }[]) => void;
}

export function ParticipantSelector({ familyId, selectedParticipants, onSelectionChange }: ParticipantSelectorProps) {
  const [members, setMembers] = useState<FamilyMemberDTO[]>([]);
  const [children, setChildren] = useState<ChildDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        const supabase = createSupabaseClientForAuth();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          return;
        }

        const [membersResponse, childrenResponse] = await Promise.all([
          fetch(`/api/families/${familyId}/members`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }),
          fetch(`/api/families/${familyId}/children`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }),
        ]);

        if (membersResponse.ok) {
          const membersData: { members: FamilyMemberDTO[] } = await membersResponse.json();
          setMembers(membersData.members);
        }

        if (childrenResponse.ok) {
          const childrenData: { children: ChildDTO[] } = await childrenResponse.json();
          setChildren(childrenData.children);
        }
      } catch (error) {
        console.error("Failed to fetch participants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [familyId]);

  const handleToggle = (id: string, type: "user" | "child") => {
    const isSelected = selectedParticipants.some((p) => p.id === id && p.type === type);
    const newSelection = isSelected
      ? selectedParticipants.filter((p) => !(p.id === id && p.type === type))
      : [...selectedParticipants, { id, type }];
    onSelectionChange(newSelection);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="block text-sm font-medium text-foreground mb-2">Participants</div>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const allParticipants: Participant[] = [
    ...members.map((m) => ({
      id: m.user_id,
      type: "user" as const,
      name: m.full_name || "Unknown",
      avatarUrl: m.avatar_url,
    })),
    ...children.map((c) => ({
      id: c.id,
      type: "child" as const,
      name: c.name,
      avatarUrl: null,
    })),
  ];

  return (
    <div className="space-y-2">
      <div className="block text-sm font-medium text-foreground mb-2">Participants</div>
      <div className="space-y-2 max-h-48 overflow-y-auto border border-primary/20 rounded-lg p-2 glass-effect scrollbar-modern">
        {allParticipants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No participants available</p>
        ) : (
          allParticipants.map((participant) => {
            const isSelected = selectedParticipants.some((p) => p.id === participant.id && p.type === participant.type);

            return (
              <div
                key={`${participant.type}-${participant.id}`}
                role="button"
                tabIndex={0}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/60 cursor-pointer transition-colors"
                onClick={() => handleToggle(participant.id, participant.type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggle(participant.id, participant.type);
                  }
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(participant.id, participant.type)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={participant.avatarUrl || undefined} alt={participant.name} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {getInitials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{participant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {participant.type === "user" ? "Family Member" : "Child"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

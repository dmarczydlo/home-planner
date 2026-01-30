import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCalendar } from "../../contexts/CalendarContext";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import type { FamilyMemberDTO, ChildDTO } from "../../types";

interface MemberFilterProps {
  familyId: string;
}

interface FilterOption {
  id: string;
  name: string;
  type: "user" | "child";
  avatarUrl?: string | null;
}

async function fetchFamilyMembers(familyId: string): Promise<FilterOption[]> {
  const [membersResponse, childrenResponse] = await Promise.all([
    fetch(`/api/families/${familyId}/members`),
    fetch(`/api/families/${familyId}/children`),
  ]);

  if (!membersResponse.ok || !childrenResponse.ok) {
    throw new Error("Failed to fetch family members");
  }

  const membersData: { members: FamilyMemberDTO[] } = await membersResponse.json();
  const childrenData: { children: ChildDTO[] } = await childrenResponse.json();

  const memberOptions: FilterOption[] = membersData.members.map((member) => ({
    id: member.user_id,
    name: member.full_name || "Unknown",
    type: "user" as const,
    avatarUrl: member.avatar_url,
  }));

  const childOptions: FilterOption[] = childrenData.children.map((child) => ({
    id: child.id,
    name: child.name,
    type: "child" as const,
  }));

  return [...memberOptions, ...childOptions];
}

export function MemberFilter({ familyId }: MemberFilterProps) {
  const { state, setFilters } = useCalendar();
  const [isExpanded, setIsExpanded] = useState(false);
  const [members, setMembers] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFamilyMembers(familyId);
        setMembers(data);
      } catch (error) {
        console.error("Failed to load family members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [familyId]);

  const handleToggleMember = (memberId: string) => {
    const currentIds = state.filters.participantIds;
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter((id) => id !== memberId)
      : [...currentIds, memberId];

    setFilters({ participantIds: newIds });
  };

  const handleToggleAll = () => {
    if (state.filters.participantIds.length === members.length) {
      setFilters({ participantIds: [] });
    } else {
      setFilters({ participantIds: members.map((m) => m.id) });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border-b border-primary/20">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const selectedCount = state.filters.participantIds.length;
  const allSelected = selectedCount === members.length;

  return (
    <div className="border-b border-primary/20 glass-effect backdrop-blur-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-card/40 transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-semibold text-foreground">Filter by Members</span>
          {selectedCount > 0 && selectedCount < members.length && (
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold bg-primary/20 text-primary border border-primary/30 rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 space-y-3">
          <div className="flex items-center space-x-2 py-2 border-b border-primary/10">
            <Checkbox id="select-all" checked={allSelected} onCheckedChange={handleToggleAll} />
            <Label htmlFor="select-all" className="text-sm font-semibold cursor-pointer text-foreground">
              {allSelected ? "Deselect All" : "Select All"}
            </Label>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => {
              const isChecked = state.filters.participantIds.includes(member.id);

              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-2 py-1.5 hover:bg-card/30 rounded-lg px-2 transition-colors"
                >
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleMember(member.id)}
                  />
                  <Label
                    htmlFor={`member-${member.id}`}
                    className="text-sm cursor-pointer flex items-center gap-2 text-foreground"
                  >
                    {member.avatarUrl && (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-6 h-6 rounded-full border border-primary/20"
                      />
                    )}
                    {member.name}
                    <span className="text-xs text-muted-foreground">({member.type})</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const selectedCount = state.filters.participantIds.length;
  const allSelected = selectedCount === members.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 border border-border hover:border-primary/50 transition-colors text-sm font-medium"
      >
        <span className="text-foreground">Filter</span>
        {selectedCount > 0 && selectedCount < members.length && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
            {selectedCount}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Filter Members</span>
            <button
              onClick={handleToggleAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              {allSelected ? "Clear All" : "Select All"}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => {
              const isChecked = state.filters.participantIds.includes(member.id);

              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleMember(member.id)}
                  />
                  <Label
                    htmlFor={`member-${member.id}`}
                    className="text-sm cursor-pointer flex items-center gap-2 flex-1"
                  >
                    {member.avatarUrl && (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="flex-1">{member.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {member.type}
                    </span>
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

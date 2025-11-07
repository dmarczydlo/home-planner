import type { Family } from "@/domain/entities/Family";
import type { FamilyMemberDTO, ChildDTO } from "@/types";

export class FamilyDTOMapper {
  static toMembersDTO(family: Family): FamilyMemberDTO[] {
    return family.members.map((member) => ({
      user_id: member.userId,
      full_name: member.name || null,
      avatar_url: member.avatarUrl || null,
      role: member.role,
      joined_at: member.joinedAt,
    }));
  }

  static toChildrenDTO(family: Family): ChildDTO[] {
    return family.children.map((child) => ({
      id: child.id,
      family_id: family.id,
      name: child.name,
      created_at: child.createdAt,
    }));
  }

  static toDetailsDTO(family: Family): { id: string; name: string; created_at: string; members: FamilyMemberDTO[]; children: ChildDTO[] } {
    return {
      id: family.id,
      name: family.name,
      created_at: family.createdAt,
      members: this.toMembersDTO(family),
      children: this.toChildrenDTO(family),
    };
  }
}


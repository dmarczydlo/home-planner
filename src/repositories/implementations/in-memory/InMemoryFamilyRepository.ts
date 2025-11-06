import type {
  FamilyRepository,
  Family,
  CreateFamilyDTO,
  UpdateFamilyDTO,
  FamilyMemberWithUser,
} from "../../interfaces/FamilyRepository.ts";

interface FamilyMemberData {
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
}

export class InMemoryFamilyRepository implements FamilyRepository {
  private families: Map<string, Family> = new Map();
  private familyMembers: Map<string, Map<string, FamilyMemberData>> = new Map(); // familyId -> Map<userId, memberData>
  private users: Map<string, { full_name: string | null; avatar_url: string | null }> = new Map();

  async findById(id: string): Promise<Family | null> {
    return this.families.get(id) ?? null;
  }

  async create(data: CreateFamilyDTO): Promise<Family> {
    const family: Family = {
      id: crypto.randomUUID(),
      name: data.name,
      created_at: new Date().toISOString(),
    };
    this.families.set(family.id, family);
    return family;
  }

  async update(id: string, data: UpdateFamilyDTO): Promise<Family> {
    const family = this.families.get(id);
    if (!family) {
      throw new Error(`Family with id ${id} not found`);
    }
    const updated: Family = {
      ...family,
      ...(data.name !== undefined && { name: data.name }),
    };
    this.families.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.families.delete(id);
    this.familyMembers.delete(id);
  }

  async findByUserId(userId: string): Promise<Family[]> {
    const families: Family[] = [];
    for (const [familyId, members] of this.familyMembers.entries()) {
      if (members.has(userId)) {
        const family = this.families.get(familyId);
        if (family) {
          families.push(family);
        }
      }
    }
    return families;
  }

  async isUserMember(familyId: string, userId: string): Promise<boolean> {
    const members = this.familyMembers.get(familyId);
    return members?.has(userId) ?? false;
  }

  async isUserAdmin(familyId: string, userId: string): Promise<boolean> {
    const members = this.familyMembers.get(familyId);
    const member = members?.get(userId);
    return member !== undefined && member.role === "admin";
  }

  async getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]> {
    const members = this.familyMembers.get(familyId);
    if (!members) {
      return [];
    }

    return Array.from(members.entries()).map(([userId, memberData]) => {
      const user = this.users.get(userId) ?? { full_name: null, avatar_url: null };
      return {
        user_id: userId,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: memberData.role,
        joined_at: memberData.joinedAt,
      };
    });
  }

  async addMember(familyId: string, userId: string, role: "admin" | "member"): Promise<void> {
    if (!this.familyMembers.has(familyId)) {
      this.familyMembers.set(familyId, new Map());
    }
    this.familyMembers.get(familyId)!.set(userId, {
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });
  }

  setUser(userId: string, user: { full_name: string | null; avatar_url: string | null }): void {
    this.users.set(userId, user);
  }
}

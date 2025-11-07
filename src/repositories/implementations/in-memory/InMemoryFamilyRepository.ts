import type {
  FamilyRepository,
  CreateFamilyDTO,
  UpdateFamilyDTO,
  FamilyMemberWithUser,
} from "../../interfaces/FamilyRepository.ts";
import type { EventRepository } from "../../interfaces/EventRepository.ts";
import { Family, type FamilyMember } from "@/domain/entities/Family.ts";

interface FamilyMemberData {
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
}

export class InMemoryFamilyRepository implements FamilyRepository {
  constructor(private readonly eventRepo: EventRepository) {}

  private families: Map<string, Family> = new Map();
  private familyMembers: Map<string, Map<string, FamilyMemberData>> = new Map(); // familyId -> Map<userId, memberData>
  private users: Map<string, { full_name: string | null; avatar_url: string | null }> = new Map();

  async findById(id: string): Promise<Family | null> {
    const family = this.families.get(id);
    if (!family) {
      return null;
    }

    const membersData = this.familyMembers.get(id) || new Map();
    const members: FamilyMember[] = Array.from(membersData.entries()).map(([userId, memberData]) => {
      const user = this.users.get(userId) ?? { full_name: null, avatar_url: null };
      return {
        id: userId,
        name: user.full_name || "",
        userId: userId,
        role: memberData.role,
        joinedAt: memberData.joinedAt,
        avatarUrl: user.avatar_url,
      };
    });

    return Family.create(family.id, family.name, family.createdAt, members, family.children, []);
  }

  async store(family: Family): Promise<void> {
    this.families.set(family.id, family);

    if (!this.familyMembers.has(family.id)) {
      this.familyMembers.set(family.id, new Map());
    }

    const membersMap = this.familyMembers.get(family.id)!;
    membersMap.clear();

    for (const member of family.members) {
      membersMap.set(member.userId, {
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
      });
    }

    if (family.events && family.events.length > 0) {
      for (const event of family.events) {
        await this.eventRepo.store(event);
      }
    }
  }

  async create(data: CreateFamilyDTO): Promise<Family> {
    const createdAt = new Date().toISOString();
    const family = Family.create(crypto.randomUUID(), data.name, createdAt, [], []);
    await this.store(family);
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

  async getMembers(familyId: string): Promise<FamilyMemberWithUser[]> {
    const members = this.familyMembers.get(familyId);
    if (!members) {
      return [];
    }

    return Array.from(members.entries())
      .map(([userId, memberData]) => {
        const user = this.users.get(userId) ?? { full_name: null, avatar_url: null };
        return {
          user_id: userId,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: memberData.role,
          joined_at: memberData.joinedAt,
        };
      })
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
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

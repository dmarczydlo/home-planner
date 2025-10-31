import type { FamilyRepository, Family, CreateFamilyDTO, UpdateFamilyDTO } from "../../interfaces/FamilyRepository.ts";

export class InMemoryFamilyRepository implements FamilyRepository {
  private families: Map<string, Family> = new Map();
  private familyMembers: Map<string, Set<string>> = new Map(); // familyId -> Set<userId>

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

  async addMember(familyId: string, userId: string): Promise<void> {
    if (!this.familyMembers.has(familyId)) {
      this.familyMembers.set(familyId, new Set());
    }
    this.familyMembers.get(familyId)!.add(userId);
  }
}

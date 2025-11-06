import type { ChildRepository, Child } from "../../interfaces/ChildRepository.ts";

export class InMemoryChildRepository implements ChildRepository {
  private children: Map<string, Child> = new Map();

  async findByFamilyId(familyId: string): Promise<Child[]> {
    return Array.from(this.children.values()).filter((child) => child.family_id === familyId);
  }

  addChild(child: Child): void {
    this.children.set(child.id, child);
  }
}


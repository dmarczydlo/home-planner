import type { ChildRepository, Child, CreateChildDTO, UpdateChildDTO } from "../../interfaces/ChildRepository.ts";

export class InMemoryChildRepository implements ChildRepository {
  private children = new Map<string, Child>();

  async findByFamilyId(familyId: string): Promise<Child[]> {
    return Array.from(this.children.values())
      .filter((child) => child.family_id === familyId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async findById(id: string): Promise<Child | null> {
    return this.children.get(id) ?? null;
  }

  async create(data: CreateChildDTO): Promise<Child> {
    const child: Child = {
      id: crypto.randomUUID(),
      family_id: data.family_id,
      name: data.name,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    this.children.set(child.id, child);
    return child;
  }

  async update(id: string, data: UpdateChildDTO): Promise<Child> {
    const child = this.children.get(id);
    if (!child) {
      throw new Error(`Child with id ${id} not found`);
    }
    const updated: Child = {
      ...child,
      ...(data.name !== undefined && { name: data.name }),
      updated_at: new Date().toISOString(),
    };
    this.children.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const exists = this.children.has(id);
    if (!exists) {
      throw new Error(`Child with id ${id} not found`);
    }
    this.children.delete(id);
  }

  async belongsToFamily(childId: string, familyId: string): Promise<boolean> {
    const child = this.children.get(childId);
    if (!child) {
      return false;
    }
    return child.family_id === familyId;
  }

  addChild(child: Child): void {
    this.children.set(child.id, child);
  }
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  created_at: string;
}

export interface ChildRepository {
  findByFamilyId(familyId: string): Promise<Child[]>;
}


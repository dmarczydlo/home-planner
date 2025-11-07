export interface Child {
  id: string;
  family_id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateChildDTO {
  family_id: string;
  name: string;
}

export interface UpdateChildDTO {
  name?: string;
}

export interface ChildRepository {
  findByFamilyId(familyId: string): Promise<Child[]>;
  findById(id: string): Promise<Child | null>;
  create(data: CreateChildDTO): Promise<Child>;
  update(id: string, data: UpdateChildDTO): Promise<Child>;
  delete(id: string): Promise<void>;
  belongsToFamily(childId: string, familyId: string): Promise<boolean>;
}


export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface CreateFamilyDTO {
  name: string;
}

export interface UpdateFamilyDTO {
  name?: string;
}

export interface FamilyMemberWithUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "member";
  joined_at: string;
}

export interface FamilyRepository {
  findById(id: string): Promise<Family | null>;
  create(data: CreateFamilyDTO): Promise<Family>;
  update(id: string, data: UpdateFamilyDTO): Promise<Family>;
  delete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<Family[]>;
  isUserMember(familyId: string, userId: string): Promise<boolean>;
  isUserAdmin(familyId: string, userId: string): Promise<boolean>;
  getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]>;
  getMembers(familyId: string): Promise<FamilyMemberWithUser[]>;
  addMember(familyId: string, userId: string, role: "admin" | "member"): Promise<void>;
}

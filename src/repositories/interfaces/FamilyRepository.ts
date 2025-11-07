import type { Family } from "@/domain/entities/Family";

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
  store(family: Family): Promise<void>;
  delete(id: string): Promise<void>;
}

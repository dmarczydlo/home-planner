import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { FamilyRepository, Family, CreateFamilyDTO, UpdateFamilyDTO } from "../../interfaces/FamilyRepository.ts";

export class SQLFamilyRepository implements FamilyRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Family | null> {
    const { data, error } = await this.supabase.from("families").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async create(data: CreateFamilyDTO): Promise<Family> {
    const { data: result, error } = await this.supabase
      .from("families")
      .insert({
        name: data.name,
      })
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create family: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async update(id: string, data: UpdateFamilyDTO): Promise<Family> {
    const updateData: Partial<Database["public"]["Tables"]["families"]["Update"]> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    const { data: result, error } = await this.supabase
      .from("families")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to update family: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("families").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete family: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<Family[]> {
    const { data, error } = await this.supabase
      .from("families")
      .select(
        `
        *,
        family_members!inner(user_id)
        `
      )
      .eq("family_members.user_id", userId);

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.mapToDomain(row));
  }

  async isUserMember(familyId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", familyId)
      .eq("user_id", userId)
      .single();

    return !error && data !== null;
  }

  private mapToDomain(row: Database["public"]["Tables"]["families"]["Row"]): Family {
    return {
      id: row.id,
      name: row.name,
      created_at: row.created_at,
    };
  }
}

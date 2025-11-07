import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { ChildRepository, Child, CreateChildDTO, UpdateChildDTO } from "../../interfaces/ChildRepository.ts";

export class SQLChildRepository implements ChildRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByFamilyId(familyId: string): Promise<Child[]> {
    const { data, error } = await this.supabase
      .from("children")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<Child | null> {
    const { data, error } = await this.supabase.from("children").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async create(data: CreateChildDTO): Promise<Child> {
    const { data: result, error } = await this.supabase
      .from("children")
      .insert({
        family_id: data.family_id,
        name: data.name,
      })
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create child: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async update(id: string, data: UpdateChildDTO): Promise<Child> {
    const updateData: Partial<Database["public"]["Tables"]["children"]["Update"]> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    const { data: result, error } = await this.supabase
      .from("children")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to update child: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("children").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete child: ${error.message}`);
    }
  }

  async belongsToFamily(childId: string, familyId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("children").select("family_id").eq("id", childId).single();

    if (error || !data) {
      return false;
    }

    return data.family_id === familyId;
  }

  private mapToDomain(row: Database["public"]["Tables"]["children"]["Row"]): Child {
    return {
      id: row.id,
      family_id: row.family_id,
      name: row.name,
      created_at: row.created_at,
      updated_at: (row as any).updated_at ?? null,
    };
  }
}

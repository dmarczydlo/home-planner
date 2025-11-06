import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { ChildRepository, Child } from "../../interfaces/ChildRepository.ts";

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

  private mapToDomain(row: Database["public"]["Tables"]["children"]["Row"]): Child {
    return {
      id: row.id,
      family_id: row.family_id,
      name: row.name,
      created_at: row.created_at,
    };
  }
}


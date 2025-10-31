import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { UserRepository, User, CreateUserDTO, UpdateUserDTO } from "../../interfaces/UserRepository.ts";

export class SQLUserRepository implements UserRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async create(data: CreateUserDTO): Promise<User> {
    const { data: result, error } = await this.supabase
      .from("users")
      .insert({
        id: data.id,
        full_name: data.full_name ?? null,
        avatar_url: data.avatar_url ?? null,
      })
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create user: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async update(id: string, data: UpdateUserDTO): Promise<User> {
    const updateData: Partial<Database["public"]["Tables"]["users"]["Update"]> = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

    const { data: result, error } = await this.supabase.from("users").update(updateData).eq("id", id).select().single();

    if (error || !result) {
      throw new Error(`Failed to update user: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("users").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  private mapToDomain(row: Database["public"]["Tables"]["users"]["Row"]): User {
    return {
      id: row.id,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      updated_at: row.updated_at,
    };
  }
}

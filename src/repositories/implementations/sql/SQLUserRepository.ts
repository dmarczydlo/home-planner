import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { UserRepository, User, CreateUserDTO, UpdateUserDTO } from "../../interfaces/UserRepository.ts";
import type { UserFamilyMembershipDTO } from "@/types";

export class SQLUserRepository implements UserRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data: users, error } = await this.supabase.auth.admin.listUsers();
      if (error || !users) {
        return null;
      }

      const authUser = users.users.find((user) => user.email === email);
      if (!authUser) {
        return null;
      }

      return this.findById(authUser.id);
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
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

  async getFamilyMemberships(userId: string): Promise<UserFamilyMembershipDTO[]> {
    const { data, error } = await this.supabase
      .from("family_members")
      .select(
        `
        family_id,
        role,
        joined_at,
        families:family_id (
          name
        )
      `
      )
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch family memberships: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      family_id: row.family_id,
      family_name: (row.families as { name: string }).name,
      role: row.role as "admin" | "member",
      joined_at: row.joined_at,
    }));
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

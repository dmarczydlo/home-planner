import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { InvitationRepository } from "../../interfaces/InvitationRepository.ts";
import type { InvitationEntity, InvitationInsert, InvitationUpdate, InvitationStatus } from "@/types";

export class SQLInvitationRepository implements InvitationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<InvitationEntity | null> {
    const { data, error } = await this.supabase.from("invitations").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findByFamilyId(familyId: string, status?: InvitationStatus): Promise<InvitationEntity[]> {
    let query = this.supabase.from("invitations").select("*").eq("family_id", familyId);

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.mapToDomain(row));
  }

  async findPendingByEmailAndFamily(email: string, familyId: string): Promise<InvitationEntity | null> {
    const { data, error } = await this.supabase
      .from("invitations")
      .select("*")
      .eq("invitee_email", email)
      .eq("family_id", familyId)
      .eq("status", "pending")
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const { data, error } = await this.supabase.from("invitations").select("*").eq("token", token).single();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async create(data: InvitationInsert): Promise<InvitationEntity> {
    const { data: result, error } = await this.supabase
      .from("invitations")
      .insert({
        family_id: data.family_id,
        invited_by: data.invited_by,
        invitee_email: data.invitee_email,
        token: data.token,
        status: data.status ?? "pending",
        expires_at: data.expires_at,
      })
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to create invitation: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async update(id: string, data: InvitationUpdate): Promise<InvitationEntity> {
    const updateData: Partial<Database["public"]["Tables"]["invitations"]["Update"]> = {};
    if (data.family_id !== undefined) updateData.family_id = data.family_id;
    if (data.invited_by !== undefined) updateData.invited_by = data.invited_by;
    if (data.invitee_email !== undefined) updateData.invitee_email = data.invitee_email;
    if (data.token !== undefined) updateData.token = data.token;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at;

    const { data: result, error } = await this.supabase
      .from("invitations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`Failed to update invitation: ${error?.message ?? "Unknown error"}`);
    }

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("invitations").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete invitation: ${error.message}`);
    }
  }

  private mapToDomain(row: Database["public"]["Tables"]["invitations"]["Row"]): InvitationEntity {
    return {
      id: row.id,
      family_id: row.family_id,
      invited_by: row.invited_by,
      invitee_email: row.invitee_email,
      token: row.token,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
    };
  }
}


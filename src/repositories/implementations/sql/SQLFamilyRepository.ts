import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { FamilyRepository } from "../../interfaces/FamilyRepository.ts";
import type { EventRepository } from "../../interfaces/EventRepository.ts";
import { Family } from "@/domain/entities/Family.ts";

export class SQLFamilyRepository implements FamilyRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly eventRepo: EventRepository
  ) {}

  async findById(id: string): Promise<Family | null> {
    const { data, error } = await this.supabase
      .from("families")
      .select(
        `
        *,
        family_members(user_id, role, joined_at, users(full_name, avatar_url)),
        children(id, name, created_at)
        `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return Family.create(
      data.id,
      data.name,
      data.created_at,
      (data.family_members || []).map((member: any) => ({
        id: member.user_id,
        name: member.users?.full_name ?? "",
        userId: member.user_id,
        role: member.role as "admin" | "member",
        joinedAt: member.joined_at,
        avatarUrl: member.users?.avatar_url ?? null,
      })),
      (data.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        createdAt: child.created_at,
      })),
      []
    );
  }

  async store(family: Family): Promise<void> {
    const { error: familyError } = await this.supabase.from("families").upsert({
      id: family.id,
      name: family.name,
      created_at: family.createdAt,
    });

    if (familyError) {
      throw new Error(`Failed to store family: ${familyError.message}`);
    }

    const existingMembers = await this.supabase.from("family_members").select("user_id").eq("family_id", family.id);

    const existingUserIds = new Set((existingMembers.data || []).map((m: any) => m.user_id));

    for (const member of family.members) {
      if (!existingUserIds.has(member.userId)) {
        const { error: memberError } = await this.supabase.from("family_members").insert({
          family_id: family.id,
          user_id: member.userId,
          role: member.role,
          joined_at: member.joinedAt,
        });

        if (memberError) {
          throw new Error(`Failed to store family member: ${memberError.message}`);
        }
      } else {
        const { error: memberError } = await this.supabase
          .from("family_members")
          .update({
            role: member.role,
          })
          .eq("family_id", family.id)
          .eq("user_id", member.userId);

        if (memberError) {
          throw new Error(`Failed to update family member: ${memberError.message}`);
        }
      }
    }

    const membersToRemove = Array.from(existingUserIds).filter(
      (userId) => !family.members.some((m) => m.userId === userId)
    );
    for (const userId of membersToRemove) {
      const { error: deleteError } = await this.supabase
        .from("family_members")
        .delete()
        .eq("family_id", family.id)
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error(`Failed to remove family member: ${deleteError.message}`);
      }
    }

    if (family.events && family.events.length > 0) {
      const existingEvents = await this.supabase.from("events").select("id").eq("family_id", family.id);
      const existingEventIds = new Set((existingEvents.data || []).map((e: any) => e.id));
      const newEventIds = new Set(family.events.map((e) => e.id));

      for (const event of family.events) {
        await this.eventRepo.store(event);
      }

      const eventsToRemove = Array.from(existingEventIds).filter((eventId) => !newEventIds.has(eventId));
      for (const eventId of eventsToRemove) {
        await this.eventRepo.delete(eventId);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("families").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete family: ${error.message}`);
    }
  }

  async addMember(familyId: string, userId: string, role: "admin" | "member"): Promise<void> {
    const { error } = await this.supabase.from("family_members").insert({
      family_id: familyId,
      user_id: userId,
      role,
    });

    if (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }
}

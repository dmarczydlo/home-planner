import type { InvitationRepository } from "../../interfaces/InvitationRepository.ts";
import type { InvitationEntity, InvitationInsert, InvitationUpdate, InvitationStatus } from "@/types";

export class InMemoryInvitationRepository implements InvitationRepository {
  private invitations: Map<string, InvitationEntity> = new Map();

  async findById(id: string): Promise<InvitationEntity | null> {
    return this.invitations.get(id) ?? null;
  }

  async findByFamilyId(familyId: string, status?: InvitationStatus): Promise<InvitationEntity[]> {
    let invitations = Array.from(this.invitations.values()).filter(
      (invitation) => invitation.family_id === familyId
    );

    if (status) {
      invitations = invitations.filter((invitation) => invitation.status === status);
    }

    return invitations.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async findPendingByEmailAndFamily(email: string, familyId: string): Promise<InvitationEntity | null> {
    const invitation = Array.from(this.invitations.values()).find(
      (inv) =>
        inv.invitee_email === email && inv.family_id === familyId && inv.status === "pending"
    );

    return invitation ?? null;
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const invitation = Array.from(this.invitations.values()).find((inv) => inv.token === token);
    return invitation ?? null;
  }

  async create(data: InvitationInsert): Promise<InvitationEntity> {
    const invitation: InvitationEntity = {
      id: data.id ?? crypto.randomUUID(),
      family_id: data.family_id,
      invited_by: data.invited_by,
      invitee_email: data.invitee_email,
      token: data.token,
      status: data.status ?? "pending",
      expires_at: data.expires_at,
      created_at: data.created_at ?? new Date().toISOString(),
    };

    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  async update(id: string, data: InvitationUpdate): Promise<InvitationEntity> {
    const invitation = this.invitations.get(id);
    if (!invitation) {
      throw new Error(`Invitation with id ${id} not found`);
    }

    const updated: InvitationEntity = {
      ...invitation,
      ...(data.family_id !== undefined && { family_id: data.family_id }),
      ...(data.invited_by !== undefined && { invited_by: data.invited_by }),
      ...(data.invitee_email !== undefined && { invitee_email: data.invitee_email }),
      ...(data.token !== undefined && { token: data.token }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.expires_at !== undefined && { expires_at: data.expires_at }),
    };

    this.invitations.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const exists = this.invitations.has(id);
    if (!exists) {
      throw new Error(`Invitation with id ${id} not found`);
    }
    this.invitations.delete(id);
  }

  addInvitation(invitation: InvitationEntity): void {
    this.invitations.set(invitation.id, invitation);
  }
}


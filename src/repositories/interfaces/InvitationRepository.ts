import type { InvitationStatus } from "@/types";
import type { InvitationEntity, InvitationInsert, InvitationUpdate } from "@/types";

export interface InvitationRepository {
  findById(id: string): Promise<InvitationEntity | null>;
  findByFamilyId(familyId: string, status?: InvitationStatus): Promise<InvitationEntity[]>;
  findPendingByEmailAndFamily(email: string, familyId: string): Promise<InvitationEntity | null>;
  findByToken(token: string): Promise<InvitationEntity | null>;
  create(data: InvitationInsert): Promise<InvitationEntity>;
  update(id: string, data: InvitationUpdate): Promise<InvitationEntity>;
  delete(id: string): Promise<void>;
}


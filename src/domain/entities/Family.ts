import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError } from "@/domain/errors";
import type { ParticipantReferenceDTO, RecurrencePatternDTO } from "@/types";
import { Event, type EventParticipant, type EventException } from "@/domain/entities/Event";
import { ParticipantService } from "@/lib/participants/ParticipantService";

export interface FamilyMember {
  id: string;
  name: string;
  role: "admin" | "member";
  joinedAt: string;
  userId: string;
  avatarUrl?: string | null;
}

export interface Child {
  id: string;
  name: string;
  createdAt: string;
}

export class Family {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: string,
    public readonly members: FamilyMember[],
    public readonly children: Child[],
    public readonly events: Event[] = []
  ) {}

  static create(
    id: string,
    name: string,
    createdAt: string,
    members: FamilyMember[],
    children: Child[],
    events: Event[] = []
  ): Family {
    if (!id || id.trim() === "") {
      throw new Error("Family id cannot be empty");
    }
    if (!name || name.trim() === "") {
      throw new Error("Family name cannot be empty");
    }
    if (!createdAt || createdAt.trim() === "") {
      throw new Error("Family createdAt cannot be empty");
    }
    if (!Array.isArray(members)) {
      throw new Error("Members must be an array");
    }
    if (!Array.isArray(children)) {
      throw new Error("Children must be an array");
    }
    if (!Array.isArray(events)) {
      throw new Error("Events must be an array");
    }
    return new Family(id, name, createdAt, members, children, events);
  }

  isMember(userId: string): boolean {
    return this.members.some((member) => member.userId === userId);
  }

  isChild(childId: string): boolean {
    return this.children.some((child) => child.id === childId);
  }

  getMember(userId: string): FamilyMember | undefined {
    return this.members.find((member) => member.userId === userId);
  }

  getAdmins(): FamilyMember[] {
    return this.members.filter((member) => member.role === "admin");
  }

  hasAdmin(): boolean {
    return this.members.some((member) => member.role === "admin");
  }

  isAdmin(userId: string): boolean {
    const member = this.getMember(userId);
    return member?.role === "admin";
  }

  getMemberRole(userId: string): "admin" | "member" | null {
    const member = this.getMember(userId);
    return member?.role ?? null;
  }

  updateName(name: string): Family {
    if (!name || name.trim() === "") {
      throw new Error("Family name cannot be empty");
    }
    return Family.create(this.id, name, this.createdAt, this.members, this.children, this.events);
  }

  addMember(member: FamilyMember): Family {
    if (this.isMember(member.userId)) {
      throw new Error(`Member with userId ${member.userId} already exists`);
    }
    const newMembers = [...this.members, member];
    return Family.create(this.id, this.name, this.createdAt, newMembers, this.children, this.events);
  }

  removeMember(userId: string): Family {
    if (!this.isMember(userId)) {
      throw new Error(`Member with userId ${userId} does not exist`);
    }
    const newMembers = this.members.filter((member) => member.userId !== userId);
    return Family.create(this.id, this.name, this.createdAt, newMembers, this.children, this.events);
  }

  removeChild(childId: string): Family {
    if (!this.isChild(childId)) {
      throw new Error(`Child with id ${childId} does not exist`);
    }
    const newChildren = this.children.filter((child) => child.id !== childId);
    return Family.create(this.id, this.name, this.createdAt, this.members, newChildren, this.events);
  }

  updateMember(userId: string, member: FamilyMember): Family {
    if (!this.isMember(userId)) {
      throw new Error(`Member with userId ${userId} does not exist`);
    }
    if (member.userId !== userId) {
      throw new Error("Member userId must match the userId parameter");
    }
    const newMembers = this.members.map((m) => (m.userId === userId ? member : m));
    return Family.create(this.id, this.name, this.createdAt, newMembers, this.children, this.events);
  }

  addChild(child: Child): Family {
    if (this.isChild(child.id)) {
      throw new Error(`Child with id ${child.id} already exists`);
    }
    const newChildren = [...this.children, child];
    return Family.create(this.id, this.name, this.createdAt, this.members, newChildren, this.events);
  }

  updateChild(childId: string, child: Child): Family {
    if (!this.isChild(childId)) {
      throw new Error(`Child with id ${childId} does not exist`);
    }
    if (child.id !== childId) {
      throw new Error("Child id must match the childId parameter");
    }
    const newChildren = this.children.map((c) => (c.id === childId ? child : c));
    return Family.create(this.id, this.name, this.createdAt, this.members, newChildren, this.events);
  }

  addEvent(event: Event): Family {
    const validationResult = this.validateEventForFamily(event);
    if (!validationResult.success) {
      throw new Error(validationResult.error.message);
    }
    const newEvents = [...this.events, event];
    return Family.create(this.id, this.name, this.createdAt, this.members, this.children, newEvents);
  }

  updateEvent(eventId: string, event: Event): Family {
    const validationResult = this.validateEventForFamily(event);
    if (!validationResult.success) {
      throw new Error(validationResult.error.message);
    }
    if (event.id !== eventId) {
      throw new Error("Event id must match the eventId parameter");
    }
    const newEvents = this.events.map((e) => (e.id === eventId ? event : e));
    return Family.create(this.id, this.name, this.createdAt, this.members, this.children, newEvents);
  }

  removeEvent(eventId: string): Family {
    const newEvents = this.events.filter((e) => e.id !== eventId);
    return Family.create(this.id, this.name, this.createdAt, this.members, this.children, newEvents);
  }

  getEvent(eventId: string): Event | undefined {
    return this.events.find((e) => e.id === eventId);
  }

  validateEventParticipants(participants: ParticipantReferenceDTO[]): Result<void, ValidationError> {
    return ParticipantService.validateParticipants(this, participants);
  }

  canAddEvent(): boolean {
    return this.members.length > 0;
  }

  createEvent(
    id: string,
    title: string,
    startTime: string,
    endTime: string,
    eventType: "elastic" | "blocker",
    isAllDay: boolean,
    createdAt: string,
    recurrencePattern: RecurrencePatternDTO | null,
    isSynced: boolean,
    externalCalendarId: string | null,
    participantRefs: ParticipantReferenceDTO[],
    exceptions: EventException[]
  ): Result<Event, ValidationError> {
    if (!this.canAddEvent()) {
      return err(new ValidationError("Family must have at least one member to add events"));
    }

    if (participantRefs.length > 0) {
      const validationResult = this.validateEventParticipants(participantRefs);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    const participants = ParticipantService.buildParticipants(this, participantRefs);

    const event = Event.create(
      id,
      this.id,
      title,
      startTime,
      endTime,
      eventType,
      isAllDay,
      createdAt,
      recurrencePattern,
      isSynced,
      externalCalendarId,
      null,
      participants,
      exceptions
    );

    return ok(event);
  }

  validateEventForFamily(event: Event): Result<void, ValidationError> {
    if (event.familyId !== this.id) {
      return err(new ValidationError("Event does not belong to this family", { event: "invalid" }));
    }

    const participantRefs: ParticipantReferenceDTO[] = event.participants.map((p) => ({
      id: p.id,
      type: p.type,
    }));

    return this.validateEventParticipants(participantRefs);
  }
}

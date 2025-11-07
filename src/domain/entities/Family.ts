import { ValidationError } from "../errors";
import { err, ok, type Result } from "../result";

export interface FamilyMember {
  id: string;
  name: string;
  role: "admin" | "member";
  userId: string;
  joinedAt: string;
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
    public readonly members: FamilyMember[],
    public readonly children: Child[]
  ) {}

  static create(id: string, name: string, members: FamilyMember[], children: Child[]): Family {
    return new Family(id, name, members, children);
  }

  isMember(userId: string): boolean {
    return this.members.some((member) => member.userId === userId);
  }

  isChild(childId: string): boolean {
    return this.children.some((child) => child.id === childId);
  }

  getMembers(): FamilyMember[] {
    return this.members;
  }

  getChildren(): Child[] {
    return this.children;
  }
}

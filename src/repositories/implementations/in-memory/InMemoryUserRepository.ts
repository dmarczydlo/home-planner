import type { UserRepository, User, CreateUserDTO, UpdateUserDTO } from "../../interfaces/UserRepository.ts";
import type { UserFamilyMembershipDTO } from "@/types";

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  private memberships = new Map<string, UserFamilyMembershipDTO[]>();
  private emailToUserId = new Map<string, string>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailToUserId.get(email.toLowerCase());
    if (!userId) {
      return null;
    }
    return this.users.get(userId) ?? null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user: User = {
      id: data.id,
      full_name: data.full_name ?? null,
      avatar_url: data.avatar_url ?? null,
      updated_at: null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateUserDTO): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated: User = {
      ...user,
      ...(data.full_name !== undefined && { full_name: data.full_name }),
      ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
    this.memberships.delete(id);
  }

  async getFamilyMemberships(userId: string): Promise<UserFamilyMembershipDTO[]> {
    return this.memberships.get(userId) || [];
  }

  seed(user: User, memberships: UserFamilyMembershipDTO[] = [], email?: string): void {
    this.users.set(user.id, user);
    this.memberships.set(user.id, memberships);
    if (email) {
      this.emailToUserId.set(email.toLowerCase(), user.id);
    }
  }

  clear(): void {
    this.users.clear();
    this.memberships.clear();
  }
}

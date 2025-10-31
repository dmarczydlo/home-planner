import type { UserRepository, User, CreateUserDTO, UpdateUserDTO } from "../../interfaces/UserRepository.ts";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
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
  }
}

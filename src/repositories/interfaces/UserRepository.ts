export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

export interface CreateUserDTO {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface UpdateUserDTO {
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface LogInsert {
  family_id?: string | null;
  actor_id?: string | null;
  actor_type: "user" | "system";
  action: string;
  details?: Record<string, unknown> | null;
}

export interface LogRepository {
  create(log: LogInsert): Promise<void>;
}


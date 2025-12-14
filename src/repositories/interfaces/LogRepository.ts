export interface LogInsert {
  family_id?: string | null;
  actor_id?: string | null;
  actor_type: "user" | "system";
  action: string;
  details?: Record<string, unknown> | null;
}

export interface LogQueryFilters {
  family_id?: string;
  actor_id?: string;
  action?: string;
  start_date?: Date;
  end_date?: Date;
  limit: number;
  offset: number;
}

export interface LogQueryResult {
  logs: Log[];
  total: number;
}

export interface Log {
  id: number;
  family_id: string | null;
  actor_id: string | null;
  actor_type: "user" | "system";
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface LogRepository {
  create(log: LogInsert): Promise<void>;
  findByFilters(filters: LogQueryFilters, userId: string, isAdmin: boolean): Promise<LogQueryResult>;
}

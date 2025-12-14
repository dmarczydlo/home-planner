import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type {
  LogRepository,
  LogInsert,
  LogQueryFilters,
  LogQueryResult,
  Log,
} from "../../interfaces/LogRepository.ts";

export class SQLLogRepository implements LogRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(log: LogInsert): Promise<void> {
    try {
      const { error } = await this.supabase.from("logs").insert({
        family_id: log.family_id ?? null,
        actor_id: log.actor_id ?? null,
        actor_type: log.actor_type,
        action: log.action,
        details: log.details ?? null,
      });

      if (error) {
        console.error("Failed to create log entry:", error);
      }
    } catch (error) {
      console.error("Unexpected error creating log entry:", error);
    }
  }

  async findByFilters(
    filters: LogQueryFilters,
    userId: string,
    isAdmin: boolean
  ): Promise<LogQueryResult> {
    let query = this.supabase.from("logs").select("*", { count: "exact" });

    if (filters.family_id) {
      query = query.eq("family_id", filters.family_id);
    }

    if (filters.actor_id) {
      query = query.eq("actor_id", filters.actor_id);
    }

    if (filters.action) {
      query = query.eq("action", filters.action);
    }

    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      startDate.setHours(0, 0, 0, 0);
      query = query.gte("created_at", startDate.toISOString());
    }

    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDate.toISOString());
    }

    if (!isAdmin) {
      query = query.or(`actor_id.eq.${userId},actor_type.eq.system`);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query.range(
      filters.offset,
      filters.offset + filters.limit - 1
    );

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    const logs: Log[] =
      data?.map((row) => ({
        id: row.id,
        family_id: row.family_id,
        actor_id: row.actor_id,
        actor_type: row.actor_type as "user" | "system",
        action: row.action,
        details: row.details as Record<string, unknown> | null,
        created_at: row.created_at,
      })) || [];

    return {
      logs,
      total: count || 0,
    };
  }
}


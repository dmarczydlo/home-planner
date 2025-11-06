import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";
import type { LogRepository, LogInsert } from "../../interfaces/LogRepository.ts";

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
}


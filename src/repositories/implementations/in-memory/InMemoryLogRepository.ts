import type { LogRepository, LogInsert, LogQueryFilters, LogQueryResult, Log } from "../../interfaces/LogRepository.ts";

export class InMemoryLogRepository implements LogRepository {
  private logs: Array<LogInsert & { id: number; created_at: string }> = [];
  private nextId = 1;

  async create(log: LogInsert): Promise<void> {
    this.logs.push({
      ...log,
      id: this.nextId++,
      created_at: new Date().toISOString(),
    });
  }

  async findByFilters(filters: LogQueryFilters, userId: string, isAdmin: boolean): Promise<LogQueryResult> {
    let filteredLogs = [...this.logs];

    if (filters.family_id) {
      filteredLogs = filteredLogs.filter((log) => log.family_id === filters.family_id);
    }

    if (filters.actor_id) {
      filteredLogs = filteredLogs.filter((log) => log.actor_id === filters.actor_id);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter((log) => log.action === filters.action);
    }

    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      startDate.setHours(0, 0, 0, 0);
      filteredLogs = filteredLogs.filter((log) => new Date(log.created_at) >= startDate);
    }

    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      filteredLogs = filteredLogs.filter((log) => new Date(log.created_at) <= endDate);
    }

    if (!isAdmin) {
      filteredLogs = filteredLogs.filter((log) => log.actor_id === userId || log.actor_type === "system");
    }

    filteredLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(filters.offset, filters.offset + filters.limit);

    const logs: Log[] = paginatedLogs.map((log) => ({
      id: log.id,
      family_id: log.family_id ?? null,
      actor_id: log.actor_id ?? null,
      actor_type: log.actor_type,
      action: log.action,
      details: log.details ?? null,
      created_at: log.created_at,
    }));

    return {
      logs,
      total,
    };
  }

  getLogs(): LogInsert[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    this.nextId = 1;
  }
}

import type { LogRepository, LogInsert } from "../../interfaces/LogRepository.ts";

export class InMemoryLogRepository implements LogRepository {
  private logs: LogInsert[] = [];

  async create(log: LogInsert): Promise<void> {
    this.logs.push(log);
  }

  getLogs(): LogInsert[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}


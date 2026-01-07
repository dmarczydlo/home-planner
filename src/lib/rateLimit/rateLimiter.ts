import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { RateLimitError } from "@/domain/errors";

const SYNC_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

class RateLimitStore {
  private lastSyncTimes: Map<string, number> = new Map();

  getLastSyncTime(calendarId: string): number | null {
    return this.lastSyncTimes.get(calendarId) || null;
  }

  setLastSyncTime(calendarId: string, timestamp: number): void {
    this.lastSyncTimes.set(calendarId, timestamp);
  }

  clear(calendarId: string): void {
    this.lastSyncTimes.delete(calendarId);
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [calendarId, timestamp] of this.lastSyncTimes.entries()) {
      if (now - timestamp > SYNC_RATE_LIMIT_MS) {
        this.lastSyncTimes.delete(calendarId);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

setInterval(() => {
  rateLimitStore.clearExpired();
}, 60 * 1000); // Clean up expired entries every minute

export class RateLimiter {
  async checkSyncRateLimit(calendarId: string): Promise<Result<void, RateLimitError>> {
    const now = Date.now();
    const lastSyncTime = rateLimitStore.getLastSyncTime(calendarId);

    if (lastSyncTime !== null) {
      const timeSinceLastSync = now - lastSyncTime;
      if (timeSinceLastSync < SYNC_RATE_LIMIT_MS) {
        const retryAfter = Math.ceil((SYNC_RATE_LIMIT_MS - timeSinceLastSync) / 1000);
        return err(
          new RateLimitError(
            `Sync rate limit exceeded. Please wait before syncing again.`,
            retryAfter
          )
        );
      }
    }

    rateLimitStore.setLastSyncTime(calendarId, now);
    return ok(undefined);
  }

  recordSync(calendarId: string): void {
    rateLimitStore.setLastSyncTime(calendarId, Date.now());
  }
}




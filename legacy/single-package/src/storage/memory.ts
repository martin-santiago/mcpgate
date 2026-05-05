import type { IStorage, RequestLogEntry, RequestStats } from "./storage.js";

const MAX_ENTRIES = 1000;

export class MemoryStorage implements IStorage {
  private logs: RequestLogEntry[] = [];

  async init(): Promise<void> {}

  async logRequest(entry: RequestLogEntry): Promise<void> {
    this.logs.push(entry);
    if (this.logs.length > MAX_ENTRIES) {
      this.logs = this.logs.slice(-MAX_ENTRIES);
    }
  }

  async getRecentLogs(limit: number): Promise<RequestLogEntry[]> {
    return this.logs.slice(-limit).reverse();
  }

  async getStats(): Promise<RequestStats> {
    const totalRequests = this.logs.length;

    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageDurationMs: 0,
        p95DurationMs: 0,
        toolBreakdown: [],
      };
    }

    const successfulRequests = this.logs.filter((logEntry) => logEntry.success).length;

    const durations = this.logs.map((logEntry) => logEntry.durationMs);
    const averageDurationMs = Math.round(
      durations.reduce((sum, duration) => sum + duration, 0) / totalRequests
    );

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p95DurationMs = sortedDurations[p95Index] ?? 0;

    const toolMap = new Map<
      string,
      {
        serverName: string;
        toolName: string;
        callCount: number;
        successCount: number;
        totalDurationMs: number;
      }
    >();

    for (const logEntry of this.logs) {
      const toolKey = `${logEntry.serverName}.${logEntry.toolName}`;
      const existing = toolMap.get(toolKey);

      if (existing) {
        existing.callCount++;
        existing.totalDurationMs += logEntry.durationMs;
        if (logEntry.success) existing.successCount++;
      } else {
        toolMap.set(toolKey, {
          serverName: logEntry.serverName,
          toolName: logEntry.toolName,
          callCount: 1,
          successCount: logEntry.success ? 1 : 0,
          totalDurationMs: logEntry.durationMs,
        });
      }
    }

    const toolBreakdown = Array.from(toolMap.values())
      .map((toolStats) => ({
        serverName: toolStats.serverName,
        toolName: toolStats.toolName,
        callCount: toolStats.callCount,
        successCount: toolStats.successCount,
        averageDurationMs: Math.round(toolStats.totalDurationMs / toolStats.callCount),
      }))
      .sort((a, b) => b.callCount - a.callCount);

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      averageDurationMs,
      p95DurationMs,
      toolBreakdown,
    };
  }

  async close(): Promise<void> {
    this.logs = [];
  }
}

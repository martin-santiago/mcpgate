import type { IStorage, RequestLogEntry } from "./storage.js";

const MAX_ENTRIES = 1000;

export class MemoryStorage implements IStorage {
  private logs: RequestLogEntry[] = [];

  async init(): Promise<void> {
    // No-op for in-memory storage
  }

  async logRequest(entry: RequestLogEntry): Promise<void> {
    this.logs.push(entry);
    if (this.logs.length > MAX_ENTRIES) {
      this.logs = this.logs.slice(-MAX_ENTRIES);
    }
  }

  async getRecentLogs(limit: number): Promise<RequestLogEntry[]> {
    return this.logs.slice(-limit).reverse();
  }

  async close(): Promise<void> {
    this.logs = [];
  }
}

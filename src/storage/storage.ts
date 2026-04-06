export type RequestLogEntry = {
  timestamp: Date;
  serverName: string;
  toolName: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
};

export type RequestStats = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDurationMs: number;
  p95DurationMs: number;
  toolBreakdown: {
    serverName: string;
    toolName: string;
    callCount: number;
    successCount: number;
    averageDurationMs: number;
  }[];
};

export type IStorage = {
  init(): Promise<void>;
  logRequest(entry: RequestLogEntry): Promise<void>;
  getRecentLogs(limit: number): Promise<RequestLogEntry[]>;
  getStats(): Promise<RequestStats>;
  close(): Promise<void>;
};

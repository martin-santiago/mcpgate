export type RequestLogEntry = {
  timestamp: Date;
  serverName: string;
  toolName: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
};

export type IStorage = {
  init(): Promise<void>;
  logRequest(entry: RequestLogEntry): Promise<void>;
  getRecentLogs(limit: number): Promise<RequestLogEntry[]>;
  close(): Promise<void>;
};

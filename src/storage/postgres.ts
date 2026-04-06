import pg from "pg";
import type { IStorage, RequestLogEntry } from "./storage.js";
import type pino from "pino";

const CREATE_REQUEST_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS request_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server_name TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT
  )
`;

const CREATE_TIMESTAMP_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp
  ON request_logs (timestamp DESC)
`;

export class PostgresStorage implements IStorage {
  private pool: pg.Pool;
  private logger: pino.Logger;

  constructor(databaseUrl: string, logger: pino.Logger) {
    this.pool = new pg.Pool({ connectionString: databaseUrl });
    this.logger = logger;
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(CREATE_REQUEST_LOGS_TABLE);
      await client.query(CREATE_TIMESTAMP_INDEX);
      this.logger.info("PostgreSQL storage initialized");
    } finally {
      client.release();
    }
  }

  async logRequest(entry: RequestLogEntry): Promise<void> {
    await this.pool.query(
      `INSERT INTO request_logs (timestamp, server_name, tool_name, duration_ms, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.timestamp,
        entry.serverName,
        entry.toolName,
        entry.durationMs,
        entry.success,
        entry.errorMessage ?? null,
      ]
    );
  }

  async getRecentLogs(limit: number): Promise<RequestLogEntry[]> {
    const result = await this.pool.query(
      `SELECT timestamp, server_name, tool_name, duration_ms, success, error_message
       FROM request_logs
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      timestamp: row.timestamp,
      serverName: row.server_name,
      toolName: row.tool_name,
      durationMs: row.duration_ms,
      success: row.success,
      errorMessage: row.error_message ?? undefined,
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info("PostgreSQL storage closed");
  }
}

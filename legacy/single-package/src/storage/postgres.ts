import pg from "pg";
import type { IStorage, RequestLogEntry, RequestStats } from "./storage.js";
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

  async getStats(): Promise<RequestStats> {
    const summaryResult = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total_requests,
         COUNT(*) FILTER (WHERE success)::int AS successful_requests,
         COUNT(*) FILTER (WHERE NOT success)::int AS failed_requests,
         COALESCE(ROUND(AVG(duration_ms))::int, 0) AS average_duration_ms,
         COALESCE((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms))::int, 0) AS p95_duration_ms
       FROM request_logs`
    );

    const summary = summaryResult.rows[0];

    const toolBreakdownResult = await this.pool.query(
      `SELECT
         server_name,
         tool_name,
         COUNT(*)::int AS call_count,
         COUNT(*) FILTER (WHERE success)::int AS success_count,
         COALESCE(ROUND(AVG(duration_ms))::int, 0) AS average_duration_ms
       FROM request_logs
       GROUP BY server_name, tool_name
       ORDER BY call_count DESC`
    );

    return {
      totalRequests: summary.total_requests,
      successfulRequests: summary.successful_requests,
      failedRequests: summary.failed_requests,
      averageDurationMs: summary.average_duration_ms,
      p95DurationMs: summary.p95_duration_ms,
      toolBreakdown: toolBreakdownResult.rows.map((row) => ({
        serverName: row.server_name,
        toolName: row.tool_name,
        callCount: row.call_count,
        successCount: row.success_count,
        averageDurationMs: row.average_duration_ms,
      })),
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info("PostgreSQL storage closed");
  }
}

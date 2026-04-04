import pino from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error";

export function createLogger(level: LogLevel = "info"): pino.Logger {
  // Always log to stderr — stdout is reserved for MCP stdio protocol
  return pino({
    level,
    transport: {
      target: "pino/file",
      options: { destination: 2 },
    },
  });
}

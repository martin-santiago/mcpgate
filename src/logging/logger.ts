import pino from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error";

export function createLogger(level: LogLevel = "info"): pino.Logger {
  return pino({
    level,
    transport: {
      target: "pino/file",
      options: { destination: 2 },
    },
  });
}

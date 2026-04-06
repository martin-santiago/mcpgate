import type { IStorage } from "./storage.js";
import { MemoryStorage } from "./memory.js";
import { PostgresStorage } from "./postgres.js";
import type pino from "pino";

export type StorageInfo = {
  storage: IStorage;
  type: "memory" | "postgres";
};

export function createStorage(logger: pino.Logger): StorageInfo {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return {
      storage: new PostgresStorage(databaseUrl, logger),
      type: "postgres",
    };
  }

  return {
    storage: new MemoryStorage(),
    type: "memory",
  };
}

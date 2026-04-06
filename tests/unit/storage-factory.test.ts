import { describe, it, expect, vi, afterEach } from "vitest";
import { createStorage } from "../../src/storage/factory.js";
import { MemoryStorage } from "../../src/storage/memory.js";
import { PostgresStorage } from "../../src/storage/postgres.js";
import type pino from "pino";

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as pino.Logger;

describe("createStorage", () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalEnv;
    }
  });

  it("returns MemoryStorage when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;

    const { storage, type } = createStorage(mockLogger);

    expect(storage).toBeInstanceOf(MemoryStorage);
    expect(type).toBe("memory");
  });

  it("returns PostgresStorage when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";

    const { storage, type } = createStorage(mockLogger);

    expect(storage).toBeInstanceOf(PostgresStorage);
    expect(type).toBe("postgres");
  });
});

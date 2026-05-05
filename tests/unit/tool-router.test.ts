import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToolRouter } from "../../src/gateway/tool-router.js";
import { ToolRegistry } from "../../src/gateway/tool-registry.js";
import { ToolNotFoundError } from "../../src/utils/errors.js";
import type { UpstreamManager } from "../../src/gateway/upstream-manager.js";
import type { IStorage } from "../../src/storage/storage.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ServerConfig } from "../../src/config/schema.js";
import type pino from "pino";

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as pino.Logger;

const mockStorage: IStorage = {
  init: vi.fn().mockResolvedValue(undefined),
  logRequest: vi.fn().mockResolvedValue(undefined),
  getRecentLogs: vi.fn().mockResolvedValue([]),
  getStats: vi
    .fn()
    .mockResolvedValue({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageDurationMs: 0,
      p95DurationMs: 0,
      toolBreakdown: [],
    }),
  close: vi.fn().mockResolvedValue(undefined),
};

const callToolMock = vi.fn();

const mockUpstreamManager = {
  callTool: callToolMock,
} as unknown as UpstreamManager;

const filesystemServer: ServerConfig = {
  name: "filesystem",
  transport: "stdio",
  command: "echo",
  args: [],
  env: {},
  tools: undefined,
};

const githubServer: ServerConfig = {
  name: "github",
  transport: "stdio",
  command: "echo",
  args: [],
  env: {},
  tools: { allow: ["create_issue"] },
};

const filesystemTools: Tool[] = [
  {
    name: "read_file",
    description: "Read a file",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "write_file",
    description: "Write a file",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

const githubTools: Tool[] = [
  {
    name: "create_issue",
    description: "Create a GitHub issue",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "list_repos",
    description: "List repos",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

describe("ToolRouter", () => {
  let toolRegistry: ToolRegistry;
  let toolRouter: ToolRouter;

  beforeEach(() => {
    vi.clearAllMocks();
    toolRegistry = new ToolRegistry(true);
    toolRegistry.registerServerTools(filesystemServer, filesystemTools);
    toolRegistry.registerServerTools(githubServer, githubTools);
    toolRouter = new ToolRouter(
      toolRegistry,
      mockUpstreamManager,
      mockStorage,
      mockLogger
    );
  });

  describe("routeToolCall", () => {
    it("routes tool call to the correct upstream server", async () => {
      const expectedResult = {
        content: [{ type: "text" as const, text: "file contents" }],
      };
      callToolMock.mockResolvedValue(expectedResult);

      const result = await toolRouter.routeToolCall("filesystem.read_file", {
        path: "/tmp/test",
      });

      expect(callToolMock).toHaveBeenCalledWith("filesystem", "read_file", {
        path: "/tmp/test",
      });
      expect(result).toEqual(expectedResult);
    });

    it("routes to github server for github tools", async () => {
      const expectedResult = {
        content: [{ type: "text" as const, text: "issue created" }],
      };
      callToolMock.mockResolvedValue(expectedResult);

      await toolRouter.routeToolCall("github.create_issue", {
        title: "Bug fix",
      });

      expect(callToolMock).toHaveBeenCalledWith("github", "create_issue", {
        title: "Bug fix",
      });
    });

    it("throws ToolNotFoundError for unknown tool", async () => {
      await expect(toolRouter.routeToolCall("unknown.tool")).rejects.toThrow(
        ToolNotFoundError
      );
    });

    it("throws ToolNotFoundError for filtered tool", async () => {
      await expect(toolRouter.routeToolCall("github.list_repos")).rejects.toThrow(
        ToolNotFoundError
      );
    });

    it("logs successful requests to storage", async () => {
      callToolMock.mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      });

      await toolRouter.routeToolCall("filesystem.read_file");

      expect(mockStorage.logRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          serverName: "filesystem",
          toolName: "read_file",
          success: true,
        })
      );
    });

    it("logs failed requests to storage", async () => {
      callToolMock.mockRejectedValue(new Error("connection lost"));

      await expect(toolRouter.routeToolCall("filesystem.read_file")).rejects.toThrow(
        "connection lost"
      );

      expect(mockStorage.logRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          serverName: "filesystem",
          toolName: "read_file",
          success: false,
          errorMessage: "connection lost",
        })
      );
    });

    it("logs error results (isError: true) as not successful", async () => {
      callToolMock.mockResolvedValue({
        content: [{ type: "text", text: "something went wrong" }],
        isError: true,
      });

      await toolRouter.routeToolCall("filesystem.read_file");

      expect(mockStorage.logRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("does not fail if storage.logRequest throws", async () => {
      vi.mocked(mockStorage.logRequest).mockRejectedValueOnce(new Error("storage down"));
      callToolMock.mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      });

      const result = await toolRouter.routeToolCall("filesystem.read_file");

      expect(result.content).toHaveLength(1);
    });

    it("records duration in milliseconds", async () => {
      callToolMock.mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      });

      await toolRouter.routeToolCall("filesystem.read_file");

      expect(mockStorage.logRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMs: expect.any(Number),
        })
      );
    });
  });
});

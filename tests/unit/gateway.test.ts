import { describe, it, expect, beforeEach, vi } from "vitest";
import { Gateway } from "../../src/gateway/gateway.js";
import type { McpGateConfig } from "../../src/config/schema.js";
import type { IStorage } from "../../src/storage/storage.js";
import type pino from "pino";

vi.mock("../../src/gateway/upstream-manager.js", () => {
  const UpstreamManager = vi.fn().mockImplementation(() => ({
    connectAll: vi.fn().mockResolvedValue([
      {
        serverConfig: {
          name: "filesystem",
          transport: "stdio",
          command: "echo",
          args: [],
          env: {},
          tools: undefined,
        },
        tools: [
          {
            name: "read_file",
            description: "Read a file",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "write_file",
            description: "Write a file",
            inputSchema: { type: "object", properties: {} },
          },
        ],
        status: "connected",
        client: {},
        transport: {},
      },
      {
        serverConfig: {
          name: "github",
          transport: "stdio",
          command: "echo",
          args: [],
          env: {},
          tools: { allow: ["create_issue"] },
        },
        tools: [
          {
            name: "create_issue",
            description: "Create issue",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "list_repos",
            description: "List repos",
            inputSchema: { type: "object", properties: {} },
          },
        ],
        status: "connected",
        client: {},
        transport: {},
      },
    ]),
    getAllConnections: vi.fn().mockReturnValue([
      {
        serverConfig: { name: "filesystem" },
        tools: [{ name: "read_file" }, { name: "write_file" }],
        status: "connected",
      },
      {
        serverConfig: { name: "github" },
        tools: [{ name: "create_issue" }, { name: "list_repos" }],
        status: "connected",
      },
    ]),
    disconnectAll: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
    }),
  }));
  return { UpstreamManager };
});

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

const testConfig: McpGateConfig = {
  gateway: {
    name: "test-gateway",
    transport: "stdio",
    port: 3000,
    toolPrefix: true,
  },
  servers: [
    {
      name: "filesystem",
      transport: "stdio",
      command: "echo",
      args: [],
      env: {},
      tools: undefined,
    },
    {
      name: "github",
      transport: "stdio",
      command: "echo",
      args: [],
      env: {},
      tools: { allow: ["create_issue"] },
    },
  ],
  logging: { level: "info" },
};

describe("Gateway", () => {
  let gateway: Gateway;

  beforeEach(() => {
    vi.clearAllMocks();
    gateway = new Gateway(testConfig, mockStorage, mockLogger);
  });

  describe("start", () => {
    it("initializes storage and connects to upstream servers", async () => {
      await gateway.start();

      expect(mockStorage.init).toHaveBeenCalled();
    });

    it("registers tools from all connected servers", async () => {
      await gateway.start();

      const tools = gateway.listTools();
      // filesystem: read_file, write_file (both active, no filter)
      // github: create_issue (active), list_repos (filtered by allow)
      expect(tools).toHaveLength(3);
    });

    it("applies tool filters correctly", async () => {
      await gateway.start();

      const tools = gateway.listTools();
      const toolNames = tools.map((tool) => tool.name);

      expect(toolNames).toContain("filesystem.read_file");
      expect(toolNames).toContain("filesystem.write_file");
      expect(toolNames).toContain("github.create_issue");
      expect(toolNames).not.toContain("github.list_repos");
    });
  });

  describe("getStatus", () => {
    it("reports running status after start", async () => {
      await gateway.start();

      const gatewayStatus = gateway.getStatus();

      expect(gatewayStatus.name).toBe("test-gateway");
      expect(gatewayStatus.status).toBe("running");
      expect(gatewayStatus.upstreams).toHaveLength(2);
      expect(gatewayStatus.tools.active).toBe(3);
      expect(gatewayStatus.tools.filtered).toBe(1);
      expect(gatewayStatus.tools.total).toBe(4);
    });

    it("reports stopped status before start", () => {
      const gatewayStatus = gateway.getStatus();
      expect(gatewayStatus.status).toBe("stopped");
    });
  });

  describe("stop", () => {
    it("disconnects all upstreams and closes storage", async () => {
      await gateway.start();
      await gateway.stop();

      expect(mockStorage.close).toHaveBeenCalled();

      const gatewayStatus = gateway.getStatus();
      expect(gatewayStatus.status).toBe("stopped");
    });
  });

  describe("callTool", () => {
    it("routes tool call through the tool router", async () => {
      await gateway.start();

      const toolCallResult = await gateway.callTool("filesystem.read_file", {
        path: "/tmp/test",
      });

      expect(toolCallResult).toBeDefined();
    });
  });

  describe("listTools", () => {
    it("returns tools in MCP format with prefixed names", async () => {
      await gateway.start();

      const tools = gateway.listTools();

      expect(tools[0]).toEqual(
        expect.objectContaining({
          name: expect.stringContaining("."),
          description: expect.any(String),
          inputSchema: expect.objectContaining({ type: "object" }),
        })
      );
    });
  });
});

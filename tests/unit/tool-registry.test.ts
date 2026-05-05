import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/gateway/tool-registry.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ServerConfig } from "../../src/config/schema.js";

const mockTools: Tool[] = [
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
  {
    name: "delete_file",
    description: "Delete a file",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

const stdioServer: ServerConfig = {
  name: "filesystem",
  transport: "stdio",
  command: "echo",
  args: [],
  env: {},
  tools: undefined,
};

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry(true);
  });

  describe("registerServerTools", () => {
    it("registers all tools with prefix when no filter", () => {
      registry.registerServerTools(stdioServer, mockTools);

      const activeTools = registry.getActiveTools();
      expect(activeTools).toHaveLength(3);
      expect(activeTools[0].exposedName).toBe("filesystem.read_file");
      expect(activeTools[0].serverName).toBe("filesystem");
    });

    it("registers tools without prefix when disabled", () => {
      const noPrefixRegistry = new ToolRegistry(false);
      noPrefixRegistry.registerServerTools(stdioServer, mockTools);

      const activeTools = noPrefixRegistry.getActiveTools();
      expect(activeTools[0].exposedName).toBe("read_file");
    });

    it("filters tools with allow list", () => {
      const serverWithAllow: ServerConfig = {
        ...stdioServer,
        tools: { allow: ["read_file"] },
      };

      registry.registerServerTools(serverWithAllow, mockTools);

      const activeTools = registry.getActiveTools();
      expect(activeTools).toHaveLength(1);
      expect(activeTools[0].originalName).toBe("read_file");

      const allTools = registry.getAllTools();
      expect(allTools).toHaveLength(3);
    });

    it("filters tools with block list", () => {
      const serverWithBlock: ServerConfig = {
        ...stdioServer,
        tools: { block: ["delete_file", "write_file"] },
      };

      registry.registerServerTools(serverWithBlock, mockTools);

      const activeTools = registry.getActiveTools();
      expect(activeTools).toHaveLength(1);
      expect(activeTools[0].originalName).toBe("read_file");
    });

    it("replaces tools on re-registration", () => {
      registry.registerServerTools(stdioServer, mockTools);
      expect(registry.getAllTools()).toHaveLength(3);

      const updatedTools: Tool[] = [
        {
          name: "new_tool",
          description: "New",
          inputSchema: { type: "object" as const, properties: {} },
        },
      ];

      registry.registerServerTools(stdioServer, updatedTools);
      expect(registry.getAllTools()).toHaveLength(1);
      expect(registry.getAllTools()[0].originalName).toBe("new_tool");
    });
  });

  describe("resolveToolRoute", () => {
    it("resolves active tool to upstream server", () => {
      registry.registerServerTools(stdioServer, mockTools);

      const route = registry.resolveToolRoute("filesystem.read_file");
      expect(route).toEqual({
        serverName: "filesystem",
        originalName: "read_file",
      });
    });

    it("returns undefined for filtered tool", () => {
      const serverWithBlock: ServerConfig = {
        ...stdioServer,
        tools: { block: ["delete_file"] },
      };
      registry.registerServerTools(serverWithBlock, mockTools);

      const route = registry.resolveToolRoute("filesystem.delete_file");
      expect(route).toBeUndefined();
    });

    it("returns undefined for unknown tool", () => {
      const route = registry.resolveToolRoute("unknown.tool");
      expect(route).toBeUndefined();
    });
  });

  describe("getStats", () => {
    it("returns correct stats", () => {
      const serverWithBlock: ServerConfig = {
        ...stdioServer,
        tools: { block: ["delete_file"] },
      };
      registry.registerServerTools(serverWithBlock, mockTools);

      const stats = registry.getStats();
      expect(stats.totalTools).toBe(3);
      expect(stats.activeTools).toBe(2);
      expect(stats.filteredTools).toBe(1);
      expect(stats.serverCount).toBe(1);
    });
  });

  describe("toMcpTools", () => {
    it("converts active tools to MCP format", () => {
      registry.registerServerTools(stdioServer, mockTools);

      const mcpTools = registry.toMcpTools();
      expect(mcpTools).toHaveLength(3);
      expect(mcpTools[0]).toEqual({
        name: "filesystem.read_file",
        description: "Read a file",
        inputSchema: { type: "object", properties: {} },
      });
    });
  });

  describe("removeServerTools", () => {
    it("removes all tools from a server", () => {
      registry.registerServerTools(stdioServer, mockTools);
      expect(registry.getAllTools()).toHaveLength(3);

      registry.removeServerTools("filesystem");
      expect(registry.getAllTools()).toHaveLength(0);
    });
  });

  describe("multi-server", () => {
    it("aggregates tools from multiple servers", () => {
      const githubServer: ServerConfig = {
        name: "github",
        transport: "stdio",
        command: "echo",
        args: [],
        env: {},
        tools: undefined,
      };

      const githubTools: Tool[] = [
        {
          name: "create_issue",
          description: "Create issue",
          inputSchema: { type: "object" as const, properties: {} },
        },
      ];

      registry.registerServerTools(stdioServer, mockTools);
      registry.registerServerTools(githubServer, githubTools);

      const activeTools = registry.getActiveTools();
      expect(activeTools).toHaveLength(4);

      const stats = registry.getStats();
      expect(stats.serverCount).toBe(2);
    });
  });
});

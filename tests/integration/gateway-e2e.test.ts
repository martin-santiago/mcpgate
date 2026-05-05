import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ToolRegistry } from "../../src/gateway/tool-registry.js";
import { MemoryStorage } from "../../src/storage/memory.js";
import type { ServerConfig } from "../../src/config/schema.js";

describe("Gateway E2E — real MCP servers via InMemoryTransport", () => {
  let filesystemServer: McpServer;
  let githubServer: McpServer;
  let filesystemClient: Client;
  let githubClient: Client;
  let filesystemTransports: [InMemoryTransport, InMemoryTransport];
  let githubTransports: [InMemoryTransport, InMemoryTransport];

  beforeEach(async () => {
    // --- Filesystem MCP Server ---
    filesystemServer = new McpServer({
      name: "filesystem-server",
      version: "1.0.0",
    });

    filesystemServer.registerTool(
      "read_file",
      {
        description: "Read contents of a file",
        inputSchema: { path: z.string().describe("Path to the file") },
      },
      async ({ path }) => ({
        content: [{ type: "text", text: `Contents of ${path}` }],
      })
    );

    filesystemServer.registerTool(
      "write_file",
      {
        description: "Write contents to a file",
        inputSchema: {
          path: z.string(),
          content: z.string(),
        },
      },
      async ({ path }) => ({
        content: [{ type: "text", text: `Written to ${path}` }],
      })
    );

    filesystemServer.registerTool(
      "delete_file",
      {
        description: "Delete a file",
        inputSchema: { path: z.string() },
      },
      async ({ path }) => ({
        content: [{ type: "text", text: `Deleted ${path}` }],
      })
    );

    // --- GitHub MCP Server ---
    githubServer = new McpServer({
      name: "github-server",
      version: "1.0.0",
    });

    githubServer.registerTool(
      "create_issue",
      {
        description: "Create a GitHub issue",
        inputSchema: {
          title: z.string(),
          body: z.string().optional(),
        },
      },
      async ({ title, body }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({ id: 42, title, body: body ?? "" }),
          },
        ],
      })
    );

    githubServer.registerTool(
      "list_repos",
      {
        description: "List GitHub repositories",
        inputSchema: {},
      },
      async () => ({
        content: [{ type: "text", text: JSON.stringify(["repo-a", "repo-b"]) }],
      })
    );

    // --- Connect via InMemoryTransport ---
    filesystemTransports = InMemoryTransport.createLinkedPair();
    githubTransports = InMemoryTransport.createLinkedPair();

    await filesystemServer.connect(filesystemTransports[1]);
    await githubServer.connect(githubTransports[1]);

    filesystemClient = new Client(
      { name: "mcpgate", version: "0.1.0" },
      { capabilities: {} }
    );
    githubClient = new Client(
      { name: "mcpgate", version: "0.1.0" },
      { capabilities: {} }
    );

    await filesystemClient.connect(filesystemTransports[0]);
    await githubClient.connect(githubTransports[0]);
  });

  afterEach(async () => {
    await filesystemClient.close();
    await githubClient.close();
    await filesystemServer.close();
    await githubServer.close();
  });

  describe("tool discovery", () => {
    it("discovers tools from real MCP servers", async () => {
      const filesystemTools = await filesystemClient.listTools();
      const githubTools = await githubClient.listTools();

      expect(filesystemTools.tools).toHaveLength(3);
      expect(githubTools.tools).toHaveLength(2);

      const filesystemToolNames = filesystemTools.tools.map((tool) => tool.name);
      expect(filesystemToolNames).toContain("read_file");
      expect(filesystemToolNames).toContain("write_file");
      expect(filesystemToolNames).toContain("delete_file");

      const githubToolNames = githubTools.tools.map((tool) => tool.name);
      expect(githubToolNames).toContain("create_issue");
      expect(githubToolNames).toContain("list_repos");
    });

    it("tools have proper inputSchema from real servers", async () => {
      const { tools } = await filesystemClient.listTools();
      const readFileTool = tools.find((tool) => tool.name === "read_file")!;

      expect(readFileTool.inputSchema.type).toBe("object");
      expect(readFileTool.inputSchema.properties).toBeDefined();
      expect(readFileTool.inputSchema.properties!["path"]).toBeDefined();
    });
  });

  describe("ToolRegistry with real upstream tools", () => {
    it("registers and filters real upstream tools correctly", async () => {
      const registry = new ToolRegistry(true);

      const filesystemConfig: ServerConfig = {
        name: "filesystem",
        transport: "stdio",
        command: "echo",
        args: [],
        env: {},
        tools: { block: ["delete_file"] },
      };

      const githubConfig: ServerConfig = {
        name: "github",
        transport: "stdio",
        command: "echo",
        args: [],
        env: {},
        tools: { allow: ["create_issue"] },
      };

      const filesystemTools = (await filesystemClient.listTools()).tools;
      const githubTools = (await githubClient.listTools()).tools;

      registry.registerServerTools(filesystemConfig, filesystemTools);
      registry.registerServerTools(githubConfig, githubTools);

      const activeTools = registry.getActiveTools();
      const activeToolNames = activeTools.map((tool) => tool.exposedName);

      // filesystem: read_file + write_file active, delete_file blocked
      expect(activeToolNames).toContain("filesystem.read_file");
      expect(activeToolNames).toContain("filesystem.write_file");
      expect(activeToolNames).not.toContain("filesystem.delete_file");

      // github: create_issue active, list_repos not in allow list
      expect(activeToolNames).toContain("github.create_issue");
      expect(activeToolNames).not.toContain("github.list_repos");

      expect(activeTools).toHaveLength(3);

      const stats = registry.getStats();
      expect(stats.totalTools).toBe(5);
      expect(stats.activeTools).toBe(3);
      expect(stats.filteredTools).toBe(2);
      expect(stats.serverCount).toBe(2);
    });

    it("resolves tool route back to original server and name", async () => {
      const registry = new ToolRegistry(true);

      const filesystemConfig: ServerConfig = {
        name: "filesystem",
        transport: "stdio",
        command: "echo",
        args: [],
        env: {},
        tools: undefined,
      };

      const filesystemTools = (await filesystemClient.listTools()).tools;
      registry.registerServerTools(filesystemConfig, filesystemTools);

      const toolRoute = registry.resolveToolRoute("filesystem.read_file");
      expect(toolRoute).toEqual({
        serverName: "filesystem",
        originalName: "read_file",
      });
    });
  });

  describe("tool call execution through real MCP protocol", () => {
    it("calls a tool on a real upstream server and gets result", async () => {
      const callResult = await filesystemClient.callTool({
        name: "read_file",
        arguments: { path: "/tmp/hello.txt" },
      });

      expect(callResult.content).toEqual([
        { type: "text", text: "Contents of /tmp/hello.txt" },
      ]);
    });

    it("calls github create_issue with arguments", async () => {
      const callResult = await githubClient.callTool({
        name: "create_issue",
        arguments: { title: "Bug report", body: "Something broke" },
      });

      const responseText = (callResult.content as Array<{ text: string }>)[0].text;
      const parsedResponse = JSON.parse(responseText);

      expect(parsedResponse.id).toBe(42);
      expect(parsedResponse.title).toBe("Bug report");
      expect(parsedResponse.body).toBe("Something broke");
    });

    it("calls tool with no arguments", async () => {
      const callResult = await githubClient.callTool({
        name: "list_repos",
        arguments: {},
      });

      const responseText = (callResult.content as Array<{ text: string }>)[0].text;
      const repos = JSON.parse(responseText);

      expect(repos).toEqual(["repo-a", "repo-b"]);
    });
  });

  describe("full gateway flow — downstream MCP server proxying upstream", () => {
    it("exposes aggregated tools from multiple upstreams via a gateway server", async () => {
      // 1. Discover tools from upstreams
      const filesystemTools = (await filesystemClient.listTools()).tools;
      const githubTools = (await githubClient.listTools()).tools;

      // 2. Register in gateway's tool registry with filtering
      const registry = new ToolRegistry(true);
      const storage = new MemoryStorage();
      await storage.init();

      const filesystemConfig: ServerConfig = {
        name: "filesystem",
        transport: "stdio",
        command: "echo",
        args: [],
        env: {},
        tools: { block: ["delete_file"] },
      };

      const githubConfig: ServerConfig = {
        name: "github",
        transport: "stdio",
        command: "echo",
        args: [],
        env: {},
        tools: { allow: ["create_issue"] },
      };

      registry.registerServerTools(filesystemConfig, filesystemTools);
      registry.registerServerTools(githubConfig, githubTools);

      // 3. Create a downstream MCP server (what Claude would connect to)
      const upstreamClients = new Map<string, Client>();
      upstreamClients.set("filesystem", filesystemClient);
      upstreamClients.set("github", githubClient);

      const gatewayServer = new Server(
        { name: "mcpgate", version: "0.1.0" },
        { capabilities: { tools: {} } }
      );

      gatewayServer.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: registry.toMcpTools(),
      }));

      gatewayServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolRoute = registry.resolveToolRoute(request.params.name);
        if (!toolRoute) {
          return {
            content: [{ type: "text" as const, text: "Tool not found" }],
            isError: true,
          };
        }

        const upstreamClient = upstreamClients.get(toolRoute.serverName)!;
        return upstreamClient.callTool({
          name: toolRoute.originalName,
          arguments: request.params.arguments as Record<string, unknown>,
        });
      });

      // 4. Connect a downstream client to the gateway via InMemoryTransport
      const [downstreamClientTransport, gatewayServerTransport] =
        InMemoryTransport.createLinkedPair();

      await gatewayServer.connect(gatewayServerTransport);

      const downstreamClient = new Client(
        { name: "claude-code", version: "1.0.0" },
        { capabilities: {} }
      );
      await downstreamClient.connect(downstreamClientTransport);

      // 5. Downstream client discovers aggregated + filtered tools
      const { tools: exposedTools } = await downstreamClient.listTools();
      const exposedToolNames = exposedTools.map((tool) => tool.name);

      expect(exposedTools).toHaveLength(3);
      expect(exposedToolNames).toContain("filesystem.read_file");
      expect(exposedToolNames).toContain("filesystem.write_file");
      expect(exposedToolNames).toContain("github.create_issue");
      expect(exposedToolNames).not.toContain("filesystem.delete_file");
      expect(exposedToolNames).not.toContain("github.list_repos");

      // 6. Downstream client calls a tool — routed through gateway to upstream
      const readResult = await downstreamClient.callTool({
        name: "filesystem.read_file",
        arguments: { path: "/etc/hosts" },
      });

      expect(readResult.content).toEqual([
        { type: "text", text: "Contents of /etc/hosts" },
      ]);

      // 7. Cross-server call — github tool
      const issueResult = await downstreamClient.callTool({
        name: "github.create_issue",
        arguments: { title: "E2E test", body: "Works!" },
      });

      const issueResponse = JSON.parse(
        (issueResult.content as Array<{ text: string }>)[0].text
      );
      expect(issueResponse.title).toBe("E2E test");
      expect(issueResponse.id).toBe(42);

      // Cleanup
      await downstreamClient.close();
      await gatewayServer.close();
      await storage.close();
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { ToolRegistry } from "../../src/gateway/tool-registry.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../../src/utils/constants.js";
import type { ServerConfig } from "../../src/config/schema.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const TEST_PORT = 19876;

const mockTools: Tool[] = [
  {
    name: "echo",
    description: "Echoes input back",
    inputSchema: {
      type: "object" as const,
      properties: { message: { type: "string" } },
      required: ["message"],
    },
  },
  {
    name: "add",
    description: "Adds two numbers",
    inputSchema: {
      type: "object" as const,
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
];

const serverConfig: ServerConfig = {
  name: "test-server",
  transport: "stdio",
  command: "echo",
  args: [],
  env: {},
  tools: undefined,
};

describe("HTTP Transport — Streamable HTTP MCP", () => {
  let httpServer: ServerType;
  const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

  beforeAll(async () => {
    const registry = new ToolRegistry(true);
    registry.registerServerTools(serverConfig, mockTools);

    const app = new Hono();

    app.all("/mcp", async (context) => {
      const sessionId = context.req.header("mcp-session-id");

      if (context.req.method === "GET" || context.req.method === "DELETE") {
        const existingTransport = sessionId ? transports.get(sessionId) : undefined;
        if (!existingTransport) {
          return context.json({ error: "Session not found" }, { status: 404 });
        }
        return existingTransport.handleRequest(context.req.raw);
      }

      if (sessionId && transports.has(sessionId)) {
        return transports.get(sessionId)!.handleRequest(context.req.raw);
      }

      const mcpTransport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports.set(newSessionId, mcpTransport);
        },
        onsessionclosed: (closedSessionId) => {
          transports.delete(closedSessionId);
        },
      });

      const mcpServer = new Server(
        { name: MCPGATE_NAME, version: MCPGATE_VERSION },
        { capabilities: { tools: {} } }
      );

      mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: registry.toMcpTools(),
      }));

      mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params.name;
        const toolArguments = request.params.arguments as Record<string, unknown>;

        if (toolName === "test-server.echo") {
          return {
            content: [{ type: "text" as const, text: String(toolArguments.message) }],
          };
        }

        if (toolName === "test-server.add") {
          const sum = Number(toolArguments.a) + Number(toolArguments.b);
          return {
            content: [{ type: "text" as const, text: String(sum) }],
          };
        }

        return {
          content: [{ type: "text" as const, text: "Unknown tool" }],
          isError: true,
        };
      });

      await mcpServer.connect(mcpTransport);
      return mcpTransport.handleRequest(context.req.raw);
    });

    app.get("/health", (context) => context.json({ status: "ok" }));

    httpServer = serve({ fetch: app.fetch, port: TEST_PORT });
  });

  afterAll(async () => {
    for (const transport of transports.values()) {
      await transport.close();
    }
    transports.clear();

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("health endpoint returns ok", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("MCP client connects via HTTP and lists tools", async () => {
    const clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://localhost:${TEST_PORT}/mcp`)
    );

    const client = new Client(
      { name: "test-http-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    expect(tools).toHaveLength(2);

    const toolNames = tools.map((tool) => tool.name);
    expect(toolNames).toContain("test-server.echo");
    expect(toolNames).toContain("test-server.add");

    await client.close();
  });

  it("MCP client calls tool via HTTP and gets result", async () => {
    const clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://localhost:${TEST_PORT}/mcp`)
    );

    const client = new Client(
      { name: "test-http-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(clientTransport);

    const echoResult = await client.callTool({
      name: "test-server.echo",
      arguments: { message: "hello from HTTP" },
    });

    expect(echoResult.content).toEqual([{ type: "text", text: "hello from HTTP" }]);

    const addResult = await client.callTool({
      name: "test-server.add",
      arguments: { a: 17, b: 25 },
    });

    expect(addResult.content).toEqual([{ type: "text", text: "42" }]);

    await client.close();
  });

  it("multiple clients can connect simultaneously", async () => {
    const clients = await Promise.all(
      Array.from({ length: 3 }, async () => {
        const clientTransport = new StreamableHTTPClientTransport(
          new URL(`http://localhost:${TEST_PORT}/mcp`)
        );
        const client = new Client(
          { name: "concurrent-client", version: "1.0.0" },
          { capabilities: {} }
        );
        await client.connect(clientTransport);
        return client;
      })
    );

    const toolListResults = await Promise.all(
      clients.map((client) => client.listTools())
    );

    for (const toolListResult of toolListResults) {
      expect(toolListResult.tools).toHaveLength(2);
    }

    await Promise.all(clients.map((client) => client.close()));
  });
});

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
import type { AuthConfig, ServerConfig } from "../../src/config/schema.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const TEST_PORT = 19877;
const AUTH_TOKEN = "test-secret-token-12345";

const mockTools: Tool[] = [
  {
    name: "echo",
    description: "Echoes input",
    inputSchema: {
      type: "object" as const,
      properties: { message: { type: "string" } },
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

function createAuthMiddleware(authConfig: AuthConfig) {
  return async (
    context: {
      req: {
        path: string;
        header: (name: string) => string | undefined;
      };
      json: (body: unknown, init?: { status: number }) => Response;
    },
    next: () => Promise<void>
  ) => {
    if (context.req.path === "/health") {
      return next();
    }

    const authHeader = context.req.header("authorization");
    if (!authHeader) {
      return context.json({ error: "Authorization required" }, { status: 401 });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || token !== authConfig.token) {
      return context.json({ error: "Invalid authorization token" }, { status: 403 });
    }

    return next();
  };
}

describe("HTTP Auth — Bearer token", () => {
  let httpServer: ServerType;
  const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

  beforeAll(async () => {
    const registry = new ToolRegistry(true);
    registry.registerServerTools(serverConfig, mockTools);

    const app = new Hono();

    app.use("*", createAuthMiddleware({ token: AUTH_TOKEN }));

    app.all("/mcp", async (context) => {
      const sessionId = context.req.header("mcp-session-id");

      if (sessionId && transports.has(sessionId)) {
        return transports.get(sessionId)!.handleRequest(context.req.raw);
      }

      const mcpTransport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports.set(newSessionId, mcpTransport);
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
        const toolArguments = request.params.arguments as Record<string, unknown>;
        return {
          content: [{ type: "text" as const, text: String(toolArguments.message) }],
        };
      });

      await mcpServer.connect(mcpTransport);
      return mcpTransport.handleRequest(context.req.raw);
    });

    app.get("/health", (context) => context.json({ status: "ok" }));

    app.get("/api/status", (context) => context.json({ status: "running" }));

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

  it("health endpoint is public — no auth required", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/health`);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  it("rejects request without auth header with 401", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/api/status`);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Authorization required");
  });

  it("rejects request with invalid token with 403", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/api/status`, {
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Invalid authorization token");
  });

  it("rejects request with non-Bearer scheme with 403", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/api/status`, {
      headers: { Authorization: `Basic ${AUTH_TOKEN}` },
    });
    expect(response.status).toBe(403);
  });

  it("allows request with valid Bearer token", async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/api/status`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("running");
  });

  it("MCP client connects with auth token via custom headers", async () => {
    const clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://localhost:${TEST_PORT}/mcp`),
      {
        requestInit: {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        },
      }
    );

    const client = new Client(
      { name: "auth-test-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("test-server.echo");

    const echoResult = await client.callTool({
      name: "test-server.echo",
      arguments: { message: "authenticated!" },
    });
    expect(echoResult.content).toEqual([{ type: "text", text: "authenticated!" }]);

    await client.close();
  });

  it("MCP client fails to connect without auth token", async () => {
    const clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://localhost:${TEST_PORT}/mcp`)
    );

    const client = new Client(
      { name: "no-auth-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await expect(client.connect(clientTransport)).rejects.toThrow();
  });
});

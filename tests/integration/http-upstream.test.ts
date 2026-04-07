import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { Hono } from "hono";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Gateway } from "../../src/gateway/gateway.js";
import { UpstreamManager } from "../../src/gateway/upstream-manager.js";
import { createLogger } from "../../src/logging/logger.js";
import { MemoryStorage } from "../../src/storage/memory.js";
import type {
  HttpServerConfig,
  McpGateConfig,
  ServerConfig,
} from "../../src/config/schema.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../../src/utils/constants.js";

const TEST_PORT = 19878;
const UPSTREAM_AUTH_TOKEN = "upstream-secret-token";

const upstreamTools: Tool[] = [
  {
    name: "echo",
    description: "Echoes input back",
    inputSchema: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
  },
  {
    name: "sum",
    description: "Adds two numbers",
    inputSchema: {
      type: "object",
      properties: { a: { type: "number" }, b: { type: "number" } },
      required: ["a", "b"],
    },
  },
];

describe("HTTP upstream support", () => {
  let upstreamHttpServer: ServerType;
  const upstreamTransports = new Map<string, WebStandardStreamableHTTPServerTransport>();

  beforeAll(async () => {
    const app = new Hono();

    app.use("/secure-mcp", async (context, next) => {
      const authHeader = context.req.header("authorization");

      if (authHeader !== `Bearer ${UPSTREAM_AUTH_TOKEN}`) {
        return context.json({ error: "Unauthorized upstream request" }, { status: 401 });
      }

      return next();
    });

    const handleMcpRequest = async (context: {
      req: {
        method: string;
        header: (name: string) => string | undefined;
        raw: Request;
      };
      json: (body: unknown, init?: { status: number }) => Response;
    }) => {
      const sessionId = context.req.header("mcp-session-id");

      if (context.req.method === "GET" || context.req.method === "DELETE") {
        const existingTransport = sessionId
          ? upstreamTransports.get(sessionId)
          : undefined;

        if (!existingTransport) {
          return context.json({ error: "Session not found" }, { status: 404 });
        }

        return existingTransport.handleRequest(context.req.raw);
      }

      if (sessionId && upstreamTransports.has(sessionId)) {
        return upstreamTransports.get(sessionId)!.handleRequest(context.req.raw);
      }

      const upstreamTransport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          upstreamTransports.set(newSessionId, upstreamTransport);
        },
        onsessionclosed: (closedSessionId) => {
          upstreamTransports.delete(closedSessionId);
        },
      });

      const upstreamServer = new Server(
        { name: MCPGATE_NAME, version: MCPGATE_VERSION },
        { capabilities: { tools: {} } }
      );

      upstreamServer.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: upstreamTools,
      }));

      upstreamServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolArguments = request.params.arguments as Record<string, unknown>;

        if (request.params.name === "echo") {
          return {
            content: [
              {
                type: "text" as const,
                text: `HTTP echo: ${String(toolArguments.message)}`,
              },
            ],
          };
        }

        if (request.params.name === "sum") {
          return {
            content: [
              {
                type: "text" as const,
                text: String(Number(toolArguments.a) + Number(toolArguments.b)),
              },
            ],
          };
        }

        return {
          content: [{ type: "text" as const, text: "Unknown tool" }],
          isError: true,
        };
      });

      await upstreamServer.connect(upstreamTransport);
      return upstreamTransport.handleRequest(context.req.raw);
    };

    app.all("/mcp", handleMcpRequest);
    app.all("/secure-mcp", handleMcpRequest);

    upstreamHttpServer = serve({ fetch: app.fetch, port: TEST_PORT });
  });

  afterAll(async () => {
    for (const upstreamTransport of upstreamTransports.values()) {
      await upstreamTransport.close();
    }

    upstreamTransports.clear();

    await new Promise<void>((resolve) => {
      upstreamHttpServer.close(() => resolve());
    });
  });

  it("connects directly to an HTTP upstream server", async () => {
    const logger = createLogger("error");
    const upstreamManager = new UpstreamManager(logger);

    const httpServerConfig: HttpServerConfig = {
      name: "remote-api",
      transport: "http",
      url: `http://localhost:${TEST_PORT}/mcp`,
      headers: {},
      tools: undefined,
    };

    const connection = await upstreamManager.connectServer(httpServerConfig);

    expect(connection.status).toBe("connected");
    expect(connection.tools).toHaveLength(2);
    expect(connection.tools.map((tool) => tool.name)).toEqual(["echo", "sum"]);

    const echoResult = await upstreamManager.callTool("remote-api", "echo", {
      message: "hello",
    });

    expect(echoResult.content).toEqual([{ type: "text", text: "HTTP echo: hello" }]);

    await upstreamManager.disconnectAll();
  });

  it("passes configured headers to an authenticated HTTP upstream", async () => {
    const logger = createLogger("error");
    const upstreamManager = new UpstreamManager(logger);

    const httpServerConfig: HttpServerConfig = {
      name: "secured-remote-api",
      transport: "http",
      url: `http://localhost:${TEST_PORT}/secure-mcp`,
      headers: {
        Authorization: `Bearer ${UPSTREAM_AUTH_TOKEN}`,
      },
      tools: undefined,
    };

    const connection = await upstreamManager.connectServer(httpServerConfig);

    expect(connection.status).toBe("connected");

    const sumResult = await upstreamManager.callTool("secured-remote-api", "sum", {
      a: 5,
      b: 7,
    });

    expect(sumResult.content).toEqual([{ type: "text", text: "12" }]);

    await upstreamManager.disconnectAll();
  });

  it("routes tool calls through gateway from an HTTP upstream", async () => {
    const storage = new MemoryStorage();
    const logger = createLogger("error");

    const config: McpGateConfig = {
      gateway: {
        name: "http-upstream-gateway",
        transport: "http",
        port: 3000,
        toolPrefix: true,
      },
      servers: [
        {
          name: "remote-api",
          transport: "http",
          url: `http://localhost:${TEST_PORT}/mcp`,
          headers: {},
          tools: undefined,
        } satisfies ServerConfig,
      ],
      logging: { level: "error" },
    };

    const gateway = new Gateway(config, storage, logger);

    await gateway.start();

    const tools = gateway.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["remote-api.echo", "remote-api.sum"]);

    const sumResult = await gateway.callTool("remote-api.sum", {
      a: 17,
      b: 25,
    });

    expect(sumResult.content).toEqual([{ type: "text", text: "42" }]);

    const recentLogs = await gateway.getRecentLogs(10);
    expect(recentLogs).toHaveLength(1);
    expect(recentLogs[0].serverName).toBe("remote-api");
    expect(recentLogs[0].toolName).toBe("sum");
    expect(recentLogs[0].success).toBe(true);

    await gateway.stop();
  });
});

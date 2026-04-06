import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Gateway } from "../gateway/gateway.js";
import { createDashboardRoutes } from "../dashboard/routes.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../utils/constants.js";
import type pino from "pino";

const MAX_CONCURRENT_SESSIONS = 100;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

export type HttpTransportOptions = {
  gateway: Gateway;
  port: number;
  logger: pino.Logger;
};

export async function startHttpTransport(options: HttpTransportOptions): Promise<void> {
  const { gateway, port, logger } = options;

  const app = new Hono();

  const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();
  const sessionLastActivity = new Map<string, number>();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const expiredSessionIds: string[] = [];

    for (const [sessionId, lastActivity] of sessionLastActivity) {
      if (now - lastActivity > SESSION_TIMEOUT_MS) {
        expiredSessionIds.push(sessionId);
      }
    }

    for (const sessionId of expiredSessionIds) {
      const expiredTransport = transports.get(sessionId);
      if (expiredTransport) {
        expiredTransport.close().catch(() => {});
      }
      transports.delete(sessionId);
      sessionLastActivity.delete(sessionId);
    }

    if (expiredSessionIds.length > 0) {
      logger.info(
        { cleanedSessions: expiredSessionIds.length, activeSessions: transports.size },
        "Cleaned up inactive HTTP sessions"
      );
    }
  }, CLEANUP_INTERVAL_MS);

  cleanupInterval.unref();

  app.all("/mcp", async (context) => {
    const sessionId = context.req.header("mcp-session-id");

    if (context.req.method === "GET" || context.req.method === "DELETE") {
      const existingTransport = sessionId ? transports.get(sessionId) : undefined;

      if (!existingTransport) {
        return context.json({ error: "Session not found" }, { status: 404 });
      }

      sessionLastActivity.set(sessionId!, Date.now());
      const response = await existingTransport.handleRequest(context.req.raw);
      return response;
    }

    if (sessionId && transports.has(sessionId)) {
      sessionLastActivity.set(sessionId, Date.now());
      const existingTransport = transports.get(sessionId)!;
      const response = await existingTransport.handleRequest(context.req.raw);
      return response;
    }

    if (transports.size >= MAX_CONCURRENT_SESSIONS) {
      logger.warn(
        { activeSessions: transports.size, maxSessions: MAX_CONCURRENT_SESSIONS },
        "Max concurrent sessions reached — rejecting new session"
      );
      return context.json({ error: "Too many concurrent sessions" }, { status: 503 });
    }

    const mcpTransport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (newSessionId) => {
        transports.set(newSessionId, mcpTransport);
        sessionLastActivity.set(newSessionId, Date.now());
        logger.info({ sessionId: newSessionId }, "MCP HTTP session initialized");
      },
      onsessionclosed: (closedSessionId) => {
        transports.delete(closedSessionId);
        sessionLastActivity.delete(closedSessionId);
        logger.info({ sessionId: closedSessionId }, "MCP HTTP session closed");
      },
    });

    const mcpServer = new Server(
      { name: MCPGATE_NAME, version: MCPGATE_VERSION },
      { capabilities: { tools: {} } }
    );

    mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      const mcpTools = gateway.listTools();
      logger.debug({ toolCount: mcpTools.length }, "HTTP client requested tool list");
      return { tools: mcpTools };
    });

    mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const toolArguments = request.params.arguments as
        | Record<string, unknown>
        | undefined;

      logger.debug({ tool: toolName }, "HTTP client calling tool");

      try {
        return await gateway.callTool(toolName, toolArguments);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ tool: toolName, error: errorMessage }, "HTTP tool call error");
        return {
          content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    });

    await mcpServer.connect(mcpTransport);
    const response = await mcpTransport.handleRequest(context.req.raw);
    return response;
  });

  app.get("/health", (context) => {
    const gatewayStatus = gateway.getStatus();
    return context.json({
      status: gatewayStatus.status === "running" ? "ok" : "degraded",
      gateway: gatewayStatus.name,
      upstreams: gatewayStatus.upstreams.length,
      tools: gatewayStatus.tools.active,
    });
  });

  const dashboardRoutes = createDashboardRoutes(gateway);
  app.route("/", dashboardRoutes);

  serve({ fetch: app.fetch, port }, () => {
    logger.info({ port }, "HTTP transport started");
  });
}

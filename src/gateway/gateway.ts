import type { McpGateConfig } from "../config/schema.js";
import type { IStorage, RequestLogEntry, RequestStats } from "../storage/storage.js";
import { GatewayStartError } from "../utils/errors.js";
import { ToolRegistry } from "./tool-registry.js";
import { ToolRouter } from "./tool-router.js";
import { UpstreamManager, type UpstreamConnection } from "./upstream-manager.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type pino from "pino";

export type GatewayStatus = {
  name: string;
  status: "starting" | "running" | "stopped" | "error";
  upstreams: {
    name: string;
    status: UpstreamConnection["status"];
    toolCount: number;
    errorMessage?: string;
  }[];
  tools: {
    total: number;
    active: number;
    filtered: number;
  };
};

export class Gateway {
  private config: McpGateConfig;
  private toolRegistry: ToolRegistry;
  private upstreamManager: UpstreamManager;
  private toolRouter: ToolRouter;
  private storage: IStorage;
  private logger: pino.Logger;
  private status: "starting" | "running" | "stopped" | "error" = "stopped";

  constructor(config: McpGateConfig, storage: IStorage, logger: pino.Logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
    this.toolRegistry = new ToolRegistry(config.gateway.toolPrefix);
    this.upstreamManager = new UpstreamManager(logger);
    this.toolRouter = new ToolRouter(
      this.toolRegistry,
      this.upstreamManager,
      storage,
      logger
    );
  }

  async start(): Promise<void> {
    this.status = "starting";
    this.logger.info("Gateway starting — connecting to upstream servers");

    await this.storage.init();

    const successfulConnections = await this.upstreamManager.connectAll(
      this.config.servers
    );

    if (successfulConnections.length === 0) {
      this.status = "error";
      throw new GatewayStartError(
        "No upstream servers connected successfully. Check your configuration."
      );
    }

    for (const connection of successfulConnections) {
      this.toolRegistry.registerServerTools(connection.serverConfig, connection.tools);
    }

    const toolStats = this.toolRegistry.getStats();

    this.logger.info(
      {
        connectedServers: successfulConnections.length,
        totalServers: this.config.servers.length,
        totalTools: toolStats.totalTools,
        activeTools: toolStats.activeTools,
        filteredTools: toolStats.filteredTools,
      },
      "Gateway ready"
    );

    this.status = "running";
  }

  async stop(): Promise<void> {
    this.logger.info("Gateway shutting down");
    await this.upstreamManager.disconnectAll();
    await this.storage.close();
    this.status = "stopped";
    this.logger.info("Gateway stopped");
  }

  listTools(): Tool[] {
    return this.toolRegistry.toMcpTools();
  }

  async callTool(exposedToolName: string, toolArguments?: Record<string, unknown>) {
    return this.toolRouter.routeToolCall(exposedToolName, toolArguments);
  }

  getRegisteredTools() {
    return this.toolRegistry.getAllTools();
  }

  async getRecentLogs(limit: number): Promise<RequestLogEntry[]> {
    return this.storage.getRecentLogs(limit);
  }

  async getRequestStats(): Promise<RequestStats> {
    return this.storage.getStats();
  }

  getStatus(): GatewayStatus {
    const toolStats = this.toolRegistry.getStats();
    const allConnections = this.upstreamManager.getAllConnections();

    return {
      name: this.config.gateway.name,
      status: this.status,
      upstreams: allConnections.map((connection) => ({
        name: connection.serverConfig.name,
        status: connection.status,
        toolCount: connection.tools.length,
        errorMessage: connection.errorMessage,
      })),
      tools: {
        total: toolStats.totalTools,
        active: toolStats.activeTools,
        filtered: toolStats.filteredTools,
      },
    };
  }
}

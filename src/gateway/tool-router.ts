import type { ToolRegistry } from "./tool-registry.js";
import type { UpstreamManager } from "./upstream-manager.js";
import type { IStorage, RequestLogEntry } from "../storage/storage.js";
import { ToolNotFoundError } from "../utils/errors.js";
import type pino from "pino";

export class ToolRouter {
  private toolRegistry: ToolRegistry;
  private upstreamManager: UpstreamManager;
  private storage: IStorage;
  private logger: pino.Logger;

  constructor(
    toolRegistry: ToolRegistry,
    upstreamManager: UpstreamManager,
    storage: IStorage,
    logger: pino.Logger
  ) {
    this.toolRegistry = toolRegistry;
    this.upstreamManager = upstreamManager;
    this.storage = storage;
    this.logger = logger;
  }

  async routeToolCall(exposedToolName: string, toolArguments?: Record<string, unknown>) {
    const toolRoute = this.toolRegistry.resolveToolRoute(exposedToolName);

    if (!toolRoute) {
      throw new ToolNotFoundError(exposedToolName);
    }

    const startTime = Date.now();

    this.logger.debug(
      {
        exposedName: exposedToolName,
        server: toolRoute.serverName,
        originalName: toolRoute.originalName,
      },
      "Routing tool call"
    );

    try {
      const callResult = await this.upstreamManager.callTool(
        toolRoute.serverName,
        toolRoute.originalName,
        toolArguments
      );

      const durationMs = Date.now() - startTime;

      this.logger.info(
        {
          exposedName: exposedToolName,
          server: toolRoute.serverName,
          durationMs,
          isError: "isError" in callResult ? callResult.isError : false,
        },
        "Tool call completed"
      );

      this.logToolRequest({
        timestamp: new Date(),
        serverName: toolRoute.serverName,
        toolName: toolRoute.originalName,
        durationMs,
        success: !("isError" in callResult && callResult.isError),
      });

      return callResult;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        {
          exposedName: exposedToolName,
          server: toolRoute.serverName,
          durationMs,
          error: errorMessage,
        },
        "Tool call failed"
      );

      this.logToolRequest({
        timestamp: new Date(),
        serverName: toolRoute.serverName,
        toolName: toolRoute.originalName,
        durationMs,
        success: false,
        errorMessage,
      });

      throw error;
    }
  }

  private logToolRequest(logEntry: RequestLogEntry): void {
    this.storage.logRequest(logEntry).catch((storageError) => {
      this.logger.warn(
        { error: (storageError as Error).message },
        "Failed to log request to storage"
      );
    });
  }
}

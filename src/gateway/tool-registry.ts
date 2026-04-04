import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ServerConfig } from "../config/schema.js";

export type RegisteredTool = {
  originalName: string;
  exposedName: string;
  serverName: string;
  description: string;
  inputSchema: Tool["inputSchema"];
  status: "active" | "filtered";
};

export type ToolRoute = {
  serverName: string;
  originalName: string;
};

export type ToolRegistryStats = {
  totalTools: number;
  activeTools: number;
  filteredTools: number;
  serverCount: number;
};

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private usePrefix: boolean;

  constructor(usePrefix: boolean) {
    this.usePrefix = usePrefix;
  }

  registerServerTools(
    serverConfig: ServerConfig,
    upstreamTools: Tool[]
  ): void {
    this.removeServerTools(serverConfig.name);

    for (const upstreamTool of upstreamTools) {
      const toolStatus = this.resolveToolStatus(
        serverConfig,
        upstreamTool.name
      );

      const exposedName = this.usePrefix
        ? `${serverConfig.name}.${upstreamTool.name}`
        : upstreamTool.name;

      const registeredTool: RegisteredTool = {
        originalName: upstreamTool.name,
        exposedName,
        serverName: serverConfig.name,
        description: upstreamTool.description ?? "",
        inputSchema: upstreamTool.inputSchema,
        status: toolStatus,
      };

      this.tools.set(exposedName, registeredTool);
    }
  }

  removeServerTools(serverName: string): void {
    for (const [exposedName, registeredTool] of this.tools) {
      if (registeredTool.serverName === serverName) {
        this.tools.delete(exposedName);
      }
    }
  }

  getActiveTools(): RegisteredTool[] {
    return Array.from(this.tools.values()).filter(
      (registeredTool) => registeredTool.status === "active"
    );
  }

  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  getToolsByServer(serverName: string): RegisteredTool[] {
    return Array.from(this.tools.values()).filter(
      (registeredTool) => registeredTool.serverName === serverName
    );
  }

  resolveToolRoute(exposedName: string): ToolRoute | undefined {
    const registeredTool = this.tools.get(exposedName);
    if (!registeredTool || registeredTool.status !== "active") {
      return undefined;
    }
    return {
      serverName: registeredTool.serverName,
      originalName: registeredTool.originalName,
    };
  }

  getStats(): ToolRegistryStats {
    const allTools = Array.from(this.tools.values());
    const serverNames = new Set(
      allTools.map((registeredTool) => registeredTool.serverName)
    );

    return {
      totalTools: allTools.length,
      activeTools: allTools.filter(
        (registeredTool) => registeredTool.status === "active"
      ).length,
      filteredTools: allTools.filter(
        (registeredTool) => registeredTool.status === "filtered"
      ).length,
      serverCount: serverNames.size,
    };
  }

  toMcpTools(): Tool[] {
    return this.getActiveTools().map((registeredTool) => ({
      name: registeredTool.exposedName,
      description: registeredTool.description,
      inputSchema: registeredTool.inputSchema,
    }));
  }

  private resolveToolStatus(
    serverConfig: ServerConfig,
    toolName: string
  ): "active" | "filtered" {
    const toolFilter = serverConfig.tools;

    if (!toolFilter) return "active";

    if (toolFilter.allow) {
      return toolFilter.allow.includes(toolName) ? "active" : "filtered";
    }

    if (toolFilter.block) {
      return toolFilter.block.includes(toolName) ? "filtered" : "active";
    }

    return "active";
  }
}

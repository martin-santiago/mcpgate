export class McpGateError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "McpGateError";
  }
}

export class UpstreamConnectionError extends McpGateError {
  constructor(
    public readonly serverName: string,
    message: string
  ) {
    super(`[${serverName}] ${message}`, "UPSTREAM_CONNECTION_ERROR");
    this.name = "UpstreamConnectionError";
  }
}

export class ToolNotFoundError extends McpGateError {
  constructor(toolName: string) {
    super(`Tool not found: ${toolName}`, "TOOL_NOT_FOUND");
    this.name = "ToolNotFoundError";
  }
}

export class ToolFilteredError extends McpGateError {
  constructor(toolName: string) {
    super(`Tool is filtered: ${toolName}`, "TOOL_FILTERED");
    this.name = "ToolFilteredError";
  }
}

export class GatewayStartError extends McpGateError {
  constructor(message: string) {
    super(message, "GATEWAY_START_ERROR");
    this.name = "GatewayStartError";
  }
}

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type {
  HttpServerConfig,
  ServerConfig,
  StdioServerConfig,
} from "../config/schema.js";
import { UpstreamConnectionError } from "../utils/errors.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../utils/constants.js";
import type pino from "pino";

export type UpstreamConnection = {
  serverConfig: ServerConfig;
  client: Client;
  transport: Transport;
  tools: Tool[];
  status: "connecting" | "connected" | "disconnected" | "error";
  errorMessage?: string;
};

export class UpstreamManager {
  private connections: Map<string, UpstreamConnection> = new Map();
  private logger: pino.Logger;

  constructor(logger: pino.Logger) {
    this.logger = logger;
  }

  async connectAll(serverConfigs: ServerConfig[]): Promise<UpstreamConnection[]> {
    const connectionResults = await Promise.allSettled(
      serverConfigs.map((serverConfig) => this.connectServer(serverConfig))
    );

    const successfulConnections: UpstreamConnection[] = [];

    for (let index = 0; index < connectionResults.length; index++) {
      const connectionResult = connectionResults[index];
      const serverConfig = serverConfigs[index];

      if (connectionResult.status === "fulfilled") {
        successfulConnections.push(connectionResult.value);
      } else {
        this.logger.error(
          { server: serverConfig.name, error: connectionResult.reason?.message },
          "Failed to connect to upstream server"
        );
      }
    }

    return successfulConnections;
  }

  async connectServer(serverConfig: ServerConfig): Promise<UpstreamConnection> {
    if (serverConfig.transport === "stdio") {
      return this.connectStdioServer(serverConfig);
    }

    return this.connectHttpServer(serverConfig);
  }

  private async connectStdioServer(
    serverConfig: StdioServerConfig
  ): Promise<UpstreamConnection> {
    const serverName = serverConfig.name;

    this.logger.info(
      { server: serverName, command: serverConfig.command, args: serverConfig.args },
      "Connecting to upstream stdio server"
    );

    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args,
      env: { ...process.env, ...serverConfig.env } as Record<string, string>,
      stderr: "pipe",
    });

    const connection = this.createConnection(serverConfig, transport);

    const stderrStream = transport.stderr;
    if (stderrStream && "on" in stderrStream) {
      stderrStream.on("data", (chunk: Buffer) => {
        this.logger.debug(
          { server: serverName, stderr: chunk.toString().trimEnd() },
          "Upstream server stderr"
        );
      });
    }

    return this.establishConnection(connection);
  }

  private async connectHttpServer(
    serverConfig: HttpServerConfig
  ): Promise<UpstreamConnection> {
    const serverName = serverConfig.name;

    this.logger.info(
      { server: serverName, url: serverConfig.url },
      "Connecting to upstream HTTP server"
    );

    const transport = new StreamableHTTPClientTransport(new URL(serverConfig.url), {
      requestInit: {
        headers: serverConfig.headers,
      },
    });

    const connection = this.createConnection(serverConfig, transport);

    return this.establishConnection(connection);
  }

  private createConnection(
    serverConfig: ServerConfig,
    transport: Transport
  ): UpstreamConnection {
    const client = new Client(
      { name: MCPGATE_NAME, version: MCPGATE_VERSION },
      { capabilities: {} }
    );

    const connection: UpstreamConnection = {
      serverConfig,
      client,
      transport,
      tools: [],
      status: "connecting",
    };

    this.connections.set(serverConfig.name, connection);

    return connection;
  }

  private async establishConnection(
    connection: UpstreamConnection
  ): Promise<UpstreamConnection> {
    const serverName = connection.serverConfig.name;

    try {
      await connection.client.connect(connection.transport);
      connection.status = "connected";

      this.logger.info({ server: serverName }, "Connected to upstream server");
    } catch (error) {
      connection.status = "error";
      connection.errorMessage = error instanceof Error ? error.message : String(error);

      throw new UpstreamConnectionError(
        serverName,
        `Failed to connect: ${connection.errorMessage}`
      );
    }

    try {
      const toolsResult = await connection.client.listTools();
      connection.tools = toolsResult.tools;

      this.logger.info(
        { server: serverName, toolCount: connection.tools.length },
        "Discovered upstream tools"
      );

      return connection;
    } catch (error) {
      connection.status = "error";
      connection.errorMessage = error instanceof Error ? error.message : String(error);

      await this.safeCloseConnection(connection);

      throw new UpstreamConnectionError(
        serverName,
        `Failed to discover tools: ${connection.errorMessage}`
      );
    }
  }

  private async safeCloseConnection(connection: UpstreamConnection): Promise<void> {
    try {
      if (connection.serverConfig.transport === "http") {
        await (connection.transport as StreamableHTTPClientTransport).terminateSession();
      }
    } catch {
      this.logger.debug(
        { server: connection.serverConfig.name },
        "Failed to terminate upstream HTTP session during cleanup"
      );
    }

    try {
      await connection.client.close();
    } catch {
      this.logger.debug(
        { server: connection.serverConfig.name },
        "Failed to close upstream client during cleanup"
      );
    }
  }

  getConnection(serverName: string): UpstreamConnection | undefined {
    return this.connections.get(serverName);
  }

  getConnectedServers(): UpstreamConnection[] {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.status === "connected"
    );
  }

  getAllConnections(): UpstreamConnection[] {
    return Array.from(this.connections.values());
  }

  async callTool(
    serverName: string,
    toolName: string,
    toolArguments?: Record<string, unknown>
  ): ReturnType<Client["callTool"]> {
    const connection = this.connections.get(serverName);

    if (!connection) {
      throw new UpstreamConnectionError(serverName, "Server not found");
    }

    if (connection.status !== "connected") {
      throw new UpstreamConnectionError(
        serverName,
        `Server is not connected (status: ${connection.status})`
      );
    }

    return connection.client.callTool({
      name: toolName,
      arguments: toolArguments,
    });
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.entries()).map(
      async ([serverName, connection]) => {
        try {
          await this.safeCloseConnection(connection);
          connection.status = "disconnected";
          this.logger.info({ server: serverName }, "Disconnected from upstream server");
        } catch (error) {
          this.logger.warn(
            { server: serverName, error: (error as Error).message },
            "Error disconnecting from upstream server"
          );
        }
      }
    );

    await Promise.allSettled(disconnectPromises);
    this.connections.clear();
  }
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Gateway } from "../gateway/gateway.js";
import { MCPGATE_NAME, MCPGATE_VERSION } from "../utils/constants.js";
import type pino from "pino";

export async function startStdioTransport(
  gateway: Gateway,
  logger: pino.Logger
): Promise<void> {
  const server = new Server(
    { name: MCPGATE_NAME, version: MCPGATE_VERSION },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const mcpTools = gateway.listTools();

    logger.debug({ toolCount: mcpTools.length }, "Client requested tool list");

    return { tools: mcpTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const toolArguments = request.params.arguments as Record<string, unknown> | undefined;

    logger.debug({ tool: toolName }, "Client calling tool");

    try {
      const toolCallResult = await gateway.callTool(toolName, toolArguments);
      return toolCallResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error({ tool: toolName, error: errorMessage }, "Tool call error");

      return {
        content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Stdio transport started — MCPGate is accepting connections");
}

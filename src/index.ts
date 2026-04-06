#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig } from "./config/loader.js";
import { createLogger } from "./logging/logger.js";
import { Gateway } from "./gateway/gateway.js";
import { createStorage } from "./storage/factory.js";
import { startStdioTransport } from "./transport/stdio-transport.js";
import { startHttpTransport } from "./transport/http-transport.js";

const program = new Command();

program
  .name("mcpgate")
  .description("Lightweight MCP gateway — aggregate, filter, and observe your MCP tools")
  .version("0.1.0");

program
  .command("start")
  .description("Start the MCPGate gateway")
  .option("-c, --config <path>", "Path to mcpgate.yaml config file")
  .action(async (options: { config?: string }) => {
    try {
      const { config, source, sourcePath } = loadConfig(options.config);
      const logger = createLogger(config.logging.level);

      logger.info(
        {
          source,
          sourcePath,
          transport: config.gateway.transport,
          serverCount: config.servers.length,
        },
        "MCPGate starting"
      );

      logger.info(
        { servers: config.servers.map((serverConfig) => serverConfig.name) },
        "Configured upstream servers"
      );

      const { storage, type: storageType } = createStorage(logger);

      logger.info({ storageType }, "Storage initialized");

      const gateway = new Gateway(config, storage, logger);

      await gateway.start();

      const gatewayTransport = config.gateway.transport;

      if (gatewayTransport === "stdio" || gatewayTransport === "both") {
        await startStdioTransport(gateway, logger);
      }

      if (gatewayTransport === "http" || gatewayTransport === "both") {
        await startHttpTransport({
          gateway,
          port: config.gateway.port,
          logger,
        });
      }

      const handleShutdown = async () => {
        logger.info("Received shutdown signal");
        await gateway.stop();
        process.exit(0);
      };

      process.on("SIGINT", handleShutdown);
      process.on("SIGTERM", handleShutdown);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${errorMessage}\n`);
      process.exit(1);
    }
  });

program.parse();

#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig } from "./config/loader.js";
import { createLogger } from "./logging/logger.js";

const program = new Command();

program
  .name("mcpgate")
  .description(
    "Lightweight MCP gateway — aggregate, filter, and observe your MCP tools"
  )
  .version("0.1.0");

program
  .command("start")
  .description("Start the MCPGate gateway")
  .option("-c, --config <path>", "Path to mcpgate.yaml config file")
  .action((options: { config?: string }) => {
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
        { servers: config.servers.map((s) => s.name) },
        "Configured upstream servers"
      );

      // TODO: Phase 1 — Initialize gateway, connect upstreams, start transport
      logger.info("MCPGate ready (gateway not yet implemented)");
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();

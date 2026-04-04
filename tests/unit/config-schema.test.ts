import { describe, it, expect } from "vitest";
import { configSchema } from "../../src/config/schema.js";

describe("configSchema", () => {
  it("validates a minimal valid config", () => {
    const minimalConfig = {
      servers: [
        {
          name: "test-server",
          transport: "stdio",
          command: "echo",
        },
      ],
    };

    const result = configSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.gateway.name).toBe("mcpgate");
      expect(result.data.gateway.transport).toBe("stdio");
      expect(result.data.gateway.port).toBe(3000);
      expect(result.data.gateway.toolPrefix).toBe(true);
      expect(result.data.logging.level).toBe("info");
    }
  });

  it("validates a full config with all fields", () => {
    const fullConfig = {
      gateway: {
        name: "my-gateway",
        transport: "both",
        port: 4000,
        toolPrefix: false,
      },
      servers: [
        {
          name: "github",
          transport: "stdio",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "test" },
          tools: { allow: ["create_issue"] },
        },
        {
          name: "remote",
          transport: "http",
          url: "https://example.com/mcp",
          headers: { Authorization: "Bearer token" },
          tools: { block: ["dangerous_tool"] },
        },
      ],
      logging: { level: "debug" },
    };

    const result = configSchema.safeParse(fullConfig);
    expect(result.success).toBe(true);
  });

  it("rejects config with no servers", () => {
    const result = configSchema.safeParse({ servers: [] });
    expect(result.success).toBe(false);
  });

  it("rejects server with both allow and block", () => {
    const config = {
      servers: [
        {
          name: "bad",
          transport: "stdio",
          command: "echo",
          tools: { allow: ["a"], block: ["b"] },
        },
      ],
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid server name with special characters", () => {
    const config = {
      servers: [
        {
          name: "bad server!",
          transport: "stdio",
          command: "echo",
        },
      ],
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects http server without url", () => {
    const config = {
      servers: [
        {
          name: "bad-http",
          transport: "http",
        },
      ],
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid port numbers", () => {
    const config = {
      gateway: { port: 99999 },
      servers: [
        { name: "test", transport: "stdio", command: "echo" },
      ],
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts server with no tools filter (all tools exposed)", () => {
    const config = {
      servers: [
        {
          name: "no-filter",
          transport: "stdio",
          command: "echo",
        },
      ],
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

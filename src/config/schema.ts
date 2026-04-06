import { z } from "zod";

const toolFilterSchema = z
  .object({
    allow: z.array(z.string()).optional(),
    block: z.array(z.string()).optional(),
  })
  .refine((filter) => !(filter.allow && filter.block), {
    message: "Cannot specify both 'allow' and 'block' for tools. Use one or the other.",
  })
  .optional();

const serverNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Server name must contain only alphanumeric characters, hyphens, and underscores"
  );

const stdioServerSchema = z.object({
  name: serverNameSchema,
  transport: z.literal("stdio"),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
  tools: toolFilterSchema,
});

const httpServerSchema = z.object({
  name: serverNameSchema,
  transport: z.literal("http"),
  url: z.string().url(),
  headers: z.record(z.string()).default({}),
  tools: toolFilterSchema,
});

const serverSchema = z.discriminatedUnion("transport", [
  stdioServerSchema,
  httpServerSchema,
]);

const gatewaySchema = z.object({
  name: z.string().min(1).default("mcpgate"),
  transport: z.enum(["stdio", "http", "both"]).default("stdio"),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  toolPrefix: z.boolean().default(true),
});

const loggingSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const configSchema = z.object({
  gateway: gatewaySchema.default({}),
  servers: z
    .array(serverSchema)
    .min(1, "At least one upstream server must be configured"),
  logging: loggingSchema.default({}),
});

export type ToolFilter =
  | {
      allow?: string[];
      block?: string[];
    }
  | undefined;

export type StdioServerConfig = {
  name: string;
  transport: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
  tools?: ToolFilter;
};

export type HttpServerConfig = {
  name: string;
  transport: "http";
  url: string;
  headers: Record<string, string>;
  tools?: ToolFilter;
};

export type ServerConfig = StdioServerConfig | HttpServerConfig;

export type GatewayConfig = {
  name: string;
  transport: "stdio" | "http" | "both";
  port: number;
  toolPrefix: boolean;
};

export type LoggingConfig = {
  level: "debug" | "info" | "warn" | "error";
};

export type McpGateConfig = {
  gateway: GatewayConfig;
  servers: ServerConfig[];
  logging: LoggingConfig;
};

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { configSchema, type McpGateConfig } from "./schema.js";
import { ConfigError } from "../utils/errors.js";

export type ConfigSource = "cli" | "env" | "file";

export type LoadConfigResult = {
  config: McpGateConfig;
  source: ConfigSource;
  sourcePath?: string;
};

export function loadConfig(cliConfigPath?: string): LoadConfigResult {
  if (cliConfigPath) {
    const resolvedPath = resolve(cliConfigPath);
    if (!existsSync(resolvedPath)) {
      throw new ConfigError(`Config file not found: ${resolvedPath}`);
    }
    const rawYaml = readFileSync(resolvedPath, "utf-8");
    return {
      config: parseAndValidate(rawYaml),
      source: "cli",
      sourcePath: resolvedPath,
    };
  }

  const encodedConfig = process.env.MCPGATE_CONFIG;
  if (encodedConfig) {
    const rawYaml = Buffer.from(encodedConfig, "base64").toString("utf-8");
    return {
      config: parseAndValidate(rawYaml),
      source: "env",
    };
  }

  const defaultPath = resolve(process.cwd(), "mcpgate.yaml");
  if (existsSync(defaultPath)) {
    const rawYaml = readFileSync(defaultPath, "utf-8");
    return {
      config: parseAndValidate(rawYaml),
      source: "file",
      sourcePath: defaultPath,
    };
  }

  throw new ConfigError(
    "No configuration found. Provide one of:\n" +
      "  --config <path>         Path to mcpgate.yaml\n" +
      "  MCPGATE_CONFIG env var  Base64-encoded YAML (for Railway/Docker)\n" +
      "  mcpgate.yaml            In the current directory"
  );
}

function parseAndValidate(rawYaml: string): McpGateConfig {
  const interpolatedYaml = interpolateEnvVars(rawYaml);
  const parsedObject = parseYaml(interpolatedYaml);

  if (parsedObject === null || parsedObject === undefined) {
    throw new ConfigError("Config file is empty or invalid YAML");
  }

  const validationResult = configSchema.safeParse(parsedObject);

  if (!validationResult.success) {
    const formattedErrors = validationResult.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new ConfigError(`Invalid configuration:\n${formattedErrors}`);
  }

  const portOverride = process.env.PORT;
  if (portOverride) {
    const parsedPort = parseInt(portOverride, 10);
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      throw new ConfigError(
        `Invalid PORT environment variable: "${portOverride}" — must be an integer between 1 and 65535`
      );
    }
    validationResult.data.gateway.port = parsedPort;
  }

  return validationResult.data;
}

function interpolateEnvVars(rawYaml: string): string {
  return rawYaml.replace(
    /\$\{(\w+)(?::-(.*?))?\}/g,
    (_, envVarName: string, defaultValue?: string) => {
      const envValue = process.env[envVarName];
      if (envValue !== undefined) return envValue;
      if (defaultValue !== undefined) return defaultValue;
      return "";
    }
  );
}

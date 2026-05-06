import fs from 'node:fs/promises'
import path from 'node:path'

import type { ManagedServiceConfig, McpGateConfig } from '../types/config'
import { getConfigPath, getDefaultHomeDir, getDefaultWorkspaceRoot } from '../utils/paths'

type ConfigFile = Partial<McpGateConfig> & Record<string, unknown>

const legacyServiceCommands = {
  api: ['yarn start:dev', 'npm run start:dev'],
  web: ['npm run dev', 'yarn dev'],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeServiceConfig(
  currentServiceConfig: Partial<ManagedServiceConfig> | undefined,
  defaultServiceConfig: ManagedServiceConfig,
  legacyCommands: string[],
): ManagedServiceConfig {
  const mergedServiceConfig = {
    ...defaultServiceConfig,
    ...currentServiceConfig,
  }

  if (legacyCommands.includes(mergedServiceConfig.command)) {
    return defaultServiceConfig
  }

  if (mergedServiceConfig.command === defaultServiceConfig.command && mergedServiceConfig.cwd !== defaultServiceConfig.cwd) {
    return {
      ...mergedServiceConfig,
      cwd: defaultServiceConfig.cwd,
    }
  }

  return mergedServiceConfig
}

export class ConfigService {
  getDefaultConfig(): McpGateConfig {
    const homeDir = getDefaultHomeDir()
    const workspaceRoot = getDefaultWorkspaceRoot()
    const dataDir = path.join(homeDir, 'data')
    const logsDir = path.join(homeDir, 'logs')
    const runtimeDir = path.join(homeDir, 'runtime')
    const sourcesDir = path.join(homeDir, 'sources')

    return {
      version: 1,
      paths: {
        dataDir,
        homeDir,
        logsDir,
        runtimeDir,
        sourcesDir,
        workspaceRoot,
      },
      services: {
        api: {
          command: 'pnpm --filter mcpgate-api run start:dev',
          cwd: workspaceRoot,
          healthUrl: 'http://127.0.0.1:3001/api',
          port: 3001,
        },
        web: {
          command: 'pnpm --filter mcpgate-web run dev',
          cwd: workspaceRoot,
          healthUrl: 'http://127.0.0.1:3000',
          port: 3000,
        },
      },
      storage: {
        mode: 'sqlite',
        sqlitePath: path.join(dataDir, 'mcpgate.sqlite'),
      },
    }
  }

  async ensureHomeStructure(config: McpGateConfig): Promise<void> {
    await Promise.all([
      fs.mkdir(config.paths.homeDir, { recursive: true }),
      fs.mkdir(config.paths.dataDir, { recursive: true }),
      fs.mkdir(config.paths.logsDir, { recursive: true }),
      fs.mkdir(config.paths.runtimeDir, { recursive: true }),
      fs.mkdir(config.paths.sourcesDir, { recursive: true }),
    ])
  }

  async writeDefaultConfig(): Promise<{ config: McpGateConfig; configPath: string }> {
    const config = this.getDefaultConfig()
    await this.ensureHomeStructure(config)

    const configPath = getConfigPath(config.paths.homeDir)
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')

    return { config, configPath }
  }

  async hasConfig(): Promise<boolean> {
    try {
      await fs.access(getConfigPath(getDefaultHomeDir()))
      return true
    } catch {
      return false
    }
  }

  async readConfig(): Promise<McpGateConfig> {
    const configPath = getConfigPath(getDefaultHomeDir())
    const fileContents = await fs.readFile(configPath, 'utf8')
    const parsedConfig = JSON.parse(fileContents) as ConfigFile

    if (parsedConfig.version !== 1 || !parsedConfig.paths || !parsedConfig.services || !parsedConfig.storage) {
      throw new Error(`Invalid MCPGate config at ${configPath}`)
    }

    const defaultConfig = this.getDefaultConfig()
    const currentPaths: Record<string, unknown> = isRecord(parsedConfig.paths) ? parsedConfig.paths : {}
    const currentServices: Record<string, unknown> = isRecord(parsedConfig.services) ? parsedConfig.services : {}
    const currentStorage: Record<string, unknown> = isRecord(parsedConfig.storage) ? parsedConfig.storage : {}
    const normalizedConfig: ConfigFile = {
      ...parsedConfig,
      paths: {
        ...defaultConfig.paths,
        ...currentPaths,
        workspaceRoot: defaultConfig.paths.workspaceRoot,
      },
      services: {
        ...currentServices,
        api: normalizeServiceConfig(
          isRecord(currentServices.api) ? currentServices.api : undefined,
          defaultConfig.services.api,
          legacyServiceCommands.api,
        ),
        web: normalizeServiceConfig(
          isRecord(currentServices.web) ? currentServices.web : undefined,
          defaultConfig.services.web,
          legacyServiceCommands.web,
        ),
      },
      storage: {
        ...defaultConfig.storage,
        ...currentStorage,
      },
    }

    if (JSON.stringify(parsedConfig) !== JSON.stringify(normalizedConfig)) {
      await this.ensureHomeStructure(normalizedConfig as McpGateConfig)
      await fs.writeFile(configPath, `${JSON.stringify(normalizedConfig, null, 2)}\n`, 'utf8')
    }

    return normalizedConfig as McpGateConfig
  }
}

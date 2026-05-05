import fs from 'node:fs/promises'
import path from 'node:path'

import type { McpGateConfig } from '../types/config'
import { getConfigPath, getDefaultHomeDir, getDefaultWorkspaceRoot } from '../utils/paths'

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
          command: 'yarn start:dev',
          cwd: path.join(workspaceRoot, 'mcpgate-api'),
          healthUrl: 'http://127.0.0.1:3001/api',
          port: 3001,
        },
        web: {
          command: 'npm run dev',
          cwd: path.join(workspaceRoot, 'mcpgate-web'),
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
    const parsedConfig = JSON.parse(fileContents) as Partial<McpGateConfig>

    if (parsedConfig.version !== 1 || !parsedConfig.paths || !parsedConfig.services || !parsedConfig.storage) {
      throw new Error(`Invalid MCPGate config at ${configPath}`)
    }

    return parsedConfig as McpGateConfig
  }
}

import fs from 'node:fs/promises'
import path from 'node:path'

import type { DoctorCheck, McpGateConfig } from '../types/config'
import { isNodeVersionSupported } from '../utils/env'
import { getConfigPath, getDefaultHomeDir } from '../utils/paths'
import { isPortAvailable } from '../utils/ports'

const expectedApiCommand = 'pnpm --filter mcpgate-api run start:dev'
const expectedWebCommand = 'pnpm --filter mcpgate-web run dev'

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function checkUrlReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    return response.status > 0
  } catch {
    return false
  }
}

export class DoctorService {
  async run(config?: McpGateConfig): Promise<DoctorCheck[]> {
    const checks: DoctorCheck[] = []

    checks.push({
      details: `Detected Node.js ${process.versions.node}`,
      label: 'Node.js runtime',
      status: isNodeVersionSupported() ? 'pass' : 'fail',
    })

    const configPath = getConfigPath(getDefaultHomeDir())
    const configExists = await pathExists(configPath)
    checks.push({
      details: configExists ? configPath : `Missing config file at ${configPath}`,
      label: 'Local config',
      status: configExists ? 'pass' : 'fail',
    })

    if (!config) {
      return checks
    }

    checks.push({
      details: config.paths.homeDir,
      label: 'Home directory',
      status: (await pathExists(config.paths.homeDir)) ? 'pass' : 'fail',
    })

    checks.push({
      details: config.paths.dataDir,
      label: 'Data directory',
      status: (await pathExists(config.paths.dataDir)) ? 'pass' : 'fail',
    })

    checks.push({
      details: config.paths.logsDir,
      label: 'Logs directory',
      status: (await pathExists(config.paths.logsDir)) ? 'pass' : 'fail',
    })

    checks.push({
      details: config.paths.workspaceRoot,
      label: 'Monorepo workspace root',
      status: (await pathExists(path.join(config.paths.workspaceRoot, 'pnpm-workspace.yaml'))) ? 'pass' : 'warn',
    })

    checks.push({
      details: path.join(config.paths.workspaceRoot, 'pnpm-lock.yaml'),
      label: 'pnpm lockfile',
      status: (await pathExists(path.join(config.paths.workspaceRoot, 'pnpm-lock.yaml'))) ? 'pass' : 'warn',
    })

    checks.push({
      details: path.join(config.paths.workspaceRoot, 'apps/api'),
      label: 'API app path',
      status: (await pathExists(path.join(config.paths.workspaceRoot, 'apps/api'))) ? 'pass' : 'warn',
    })

    checks.push({
      details: path.join(config.paths.workspaceRoot, 'apps/web'),
      label: 'Web app path',
      status: (await pathExists(path.join(config.paths.workspaceRoot, 'apps/web'))) ? 'pass' : 'warn',
    })

    checks.push({
      details: config.services.api.command,
      label: 'API start command',
      status: config.services.api.cwd === config.paths.workspaceRoot && config.services.api.command === expectedApiCommand ? 'pass' : 'warn',
    })

    checks.push({
      details: config.services.web.command,
      label: 'Web start command',
      status: config.services.web.cwd === config.paths.workspaceRoot && config.services.web.command === expectedWebCommand ? 'pass' : 'warn',
    })

    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      const portAvailable = await isPortAvailable(serviceConfig.port)
      const urlReachable = await checkUrlReachable(serviceConfig.healthUrl)

      checks.push({
        details: portAvailable
          ? `Port ${serviceConfig.port} is free`
          : urlReachable
            ? `Port ${serviceConfig.port} is already serving ${serviceName}`
            : `Port ${serviceConfig.port} is busy`,
        label: `${serviceName} port`,
        status: portAvailable || urlReachable ? 'pass' : 'warn',
      })
    }

    return checks
  }
}

import { spawn, type ChildProcess } from 'node:child_process'

import type { ManagedServiceConfig, ManagedServiceName, McpGateConfig } from '../types/config'

type ManagedChildProcess = {
  childProcess: ChildProcess
  name: ManagedServiceName
}

type LocalServiceStartOptions = {
  apiOnly: boolean
  readinessTimeoutMs: number
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitForService(url: string, timeoutMs = 15_000): Promise<boolean> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.status > 0) return true
    } catch {
      await wait(1_000)
      continue
    }

    await wait(1_000)
  }

  return false
}

function pipeProcessOutput(name: string, stream: NodeJS.ReadableStream | null, writer: NodeJS.WriteStream): void {
  if (!stream) return

  stream.on('data', (chunk: Buffer | string) => {
    const lines = chunk.toString().split(/\r?\n/).filter(Boolean)
    for (const line of lines) {
      writer.write(`[${name}] ${line}\n`)
    }
  })
}

function startManagedService(
  name: ManagedServiceName,
  serviceConfig: ManagedServiceConfig,
  sqlitePath: string,
): ManagedChildProcess {
  const envOverrides: Record<string, string> = {
    PORT: String(serviceConfig.port),
  }

  if (name === 'api') {
    envOverrides.FRONTEND_URL = 'http://127.0.0.1:3000'
    envOverrides.MCPGATE_LOCAL_MODE = 'true'
    envOverrides.MCPGATE_STORAGE_MODE = 'sqlite'
    envOverrides.MCPGATE_SQLITE_PATH = sqlitePath
    envOverrides.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
    envOverrides.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'local-anon-key'
    envOverrides.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-service-role-key'
  }

  if (name === 'web') {
    envOverrides.NEXT_PUBLIC_API_URL = 'http://127.0.0.1:3001/api'
  }

  const childProcess = spawn(serviceConfig.command, {
    cwd: serviceConfig.cwd,
    detached: true,
    env: {
      ...process.env,
      ...envOverrides,
    },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  pipeProcessOutput(name, childProcess.stdout, process.stdout)
  pipeProcessOutput(name, childProcess.stderr, process.stderr)

  return { childProcess, name }
}

function stopManagedProcess(managedProcess: ManagedChildProcess): void {
  const processId = managedProcess.childProcess.pid

  if (!processId) return

  try {
    process.kill(-processId, 'SIGTERM')
  } catch {
    managedProcess.childProcess.kill('SIGTERM')
  }
}

export class LocalServiceManager {
  async start(config: McpGateConfig, options: LocalServiceStartOptions): Promise<void> {
    const managedProcesses = [startManagedService('api', config.services.api, config.storage.sqlitePath)]

    if (!options.apiOnly) {
      managedProcesses.push(startManagedService('web', config.services.web, config.storage.sqlitePath))
    }

    const cleanup = () => {
      for (const managedProcess of managedProcesses) {
        stopManagedProcess(managedProcess)
      }
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    const apiReady = await waitForService(config.services.api.healthUrl, options.readinessTimeoutMs)
    const webReady = options.apiOnly
      ? false
      : await waitForService(config.services.web.healthUrl, options.readinessTimeoutMs)

    process.stdout.write('\nMCPGate local services\n')
    process.stdout.write(`- API: ${config.services.api.healthUrl} (${apiReady ? 'ready' : 'starting'})\n`)
    process.stdout.write(
      options.apiOnly
        ? '- Dashboard: skipped by API-only mode\n'
        : `- Dashboard: ${config.services.web.healthUrl} (${webReady ? 'ready' : 'starting'})\n`,
    )
    process.stdout.write(`- Storage: ${config.storage.mode} -> ${config.storage.sqlitePath}\n`)
    process.stdout.write(`- Logs: ${config.paths.logsDir}\n`)
    if (!apiReady) {
      process.stdout.write('- Note: the current API scaffold still depends on its existing database env/config and may need follow-up work for true local-first boot.\n')
    }
    process.stdout.write('Press Ctrl+C to stop local services.\n\n')

    await Promise.all(
      managedProcesses.map(
        (managedProcess) =>
          new Promise<void>((resolve) => {
            managedProcess.childProcess.once('exit', () => resolve())
          }),
      ),
    )
  }
}

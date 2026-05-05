export type StorageMode = 'sqlite' | 'postgres'

export type ManagedServiceName = 'api' | 'web'

export type ManagedServiceConfig = {
  command: string
  cwd: string
  healthUrl: string
  port: number
}

export type McpGateConfig = {
  version: 1
  paths: {
    dataDir: string
    homeDir: string
    logsDir: string
    runtimeDir: string
    sourcesDir: string
    workspaceRoot: string
  }
  services: Record<ManagedServiceName, ManagedServiceConfig>
  storage: {
    mode: StorageMode
    sqlitePath: string
  }
}

export type DoctorCheckStatus = 'pass' | 'warn' | 'fail'

export type DoctorCheck = {
  details: string
  label: string
  status: DoctorCheckStatus
}

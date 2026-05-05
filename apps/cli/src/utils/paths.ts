import os from 'node:os'
import path from 'node:path'

export function getCliRoot(): string {
  return path.resolve(__dirname, '../..')
}

export function getDefaultWorkspaceRoot(): string {
  return path.resolve(getCliRoot(), '..')
}

export function getDefaultHomeDir(): string {
  return path.join(os.homedir(), '.mcpgate')
}

export function getConfigPath(homeDir: string): string {
  return path.join(homeDir, 'config.json')
}

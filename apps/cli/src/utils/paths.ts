import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

export function getCliRoot(): string {
  return path.resolve(__dirname, '../..')
}

function findWorkspaceRoot(startPath: string): string | undefined {
  let currentPath = startPath

  while (currentPath !== path.dirname(currentPath)) {
    const workspaceFilePath = path.join(currentPath, 'pnpm-workspace.yaml')
    const packageFilePath = path.join(currentPath, 'package.json')

    if (fs.existsSync(workspaceFilePath) && fs.existsSync(packageFilePath)) {
      return currentPath
    }

    currentPath = path.dirname(currentPath)
  }

  return undefined
}

export function getDefaultWorkspaceRoot(): string {
  return findWorkspaceRoot(getCliRoot()) ?? path.resolve(getCliRoot(), '../..')
}

export function getDefaultHomeDir(): string {
  return path.join(os.homedir(), '.mcpgate')
}

export function getConfigPath(homeDir: string): string {
  return path.join(homeDir, 'config.json')
}

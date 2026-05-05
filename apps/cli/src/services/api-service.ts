import type { McpGateConfig } from '../types/config'

export type WorkspaceRecord = {
  id: string
  name: string
  ownerId: string
  status: string
}

export type SourceRecord = {
  id: string
  workspaceId: string
  name: string
  type: 'custom' | 'supabase' | 'slack' | 'grafana'
  status: string
  config?: Record<string, unknown>
  lastError: string | null
  lastConnectedAt: string | null
}

export type SourceConnectionTestResult = {
  message: string
  ok: boolean
}

export type SourceDiscoveryResult = {
  count: number
  message: string
  tools: Array<{
    id: string
    name: string
    toolKey: string
  }>
}

export type ToolRecord = {
  capability: 'read' | 'write' | 'admin' | 'unknown'
  description: string | null
  id: string
  inputSchema: Record<string, unknown> | null
  isActive: boolean
  name: string
  sourceId: string
  toolKey: string
  workspaceId: string
}

type CreateWorkspacePayload = {
  name: string
}

type CreateSourcePayload = {
  config: Record<string, unknown>
  name: string
  type: SourceRecord['type']
}

export class ApiService {
  constructor(private readonly config: McpGateConfig) {}

  private get apiBaseUrl(): string {
    return this.config.services.api.healthUrl
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(errorPayload.message || `Request failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  async listWorkspaces(): Promise<WorkspaceRecord[]> {
    return this.request<WorkspaceRecord[]>('/workspaces')
  }

  async createWorkspace(payload: CreateWorkspacePayload): Promise<WorkspaceRecord> {
    return this.request<WorkspaceRecord>('/workspaces', {
      body: JSON.stringify(payload),
      method: 'POST',
    })
  }

  async ensureWorkspace(name: string): Promise<WorkspaceRecord> {
    const workspaces = await this.listWorkspaces()
    const existingWorkspace = workspaces.find((workspace) => workspace.name === name)

    if (existingWorkspace) return existingWorkspace

    return this.createWorkspace({ name })
  }

  async listSources(workspaceId: string): Promise<SourceRecord[]> {
    return this.request<SourceRecord[]>(`/workspaces/${workspaceId}/sources`)
  }

  async createSource(workspaceId: string, payload: CreateSourcePayload): Promise<SourceRecord> {
    return this.request<SourceRecord>(`/workspaces/${workspaceId}/sources`, {
      body: JSON.stringify(payload),
      method: 'POST',
    })
  }

  async testSource(workspaceId: string, sourceId: string): Promise<SourceConnectionTestResult> {
    return this.request<SourceConnectionTestResult>(`/workspaces/${workspaceId}/sources/${sourceId}/test`, {
      method: 'POST',
    })
  }

  async discoverSource(workspaceId: string, sourceId: string): Promise<SourceDiscoveryResult> {
    return this.request<SourceDiscoveryResult>(`/workspaces/${workspaceId}/sources/${sourceId}/discover-tools`, {
      method: 'POST',
    })
  }

  async listTools(workspaceId: string): Promise<ToolRecord[]> {
    return this.request<ToolRecord[]>(`/workspaces/${workspaceId}/tools`)
  }
}

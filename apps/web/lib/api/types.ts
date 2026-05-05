export type Workspace = {
  id: string
  name: string
  ownerId: string
  status: string
  createdAt: string
  updatedAt: string
}

export type SourceType = 'custom' | 'supabase' | 'slack'
export type SourceStatus = 'connected' | 'disconnected' | 'error' | 'pending'

export type Source = {
  id: string
  workspaceId: string
  name: string
  type: SourceType
  status: SourceStatus
  config: Record<string, unknown>
  lastError: string | null
  lastConnectedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ToolCapability = 'read' | 'write' | 'admin' | 'unknown'

export type Tool = {
  id: string
  sourceId: string
  workspaceId: string
  name: string
  description: string
  toolKey: string
  capability: ToolCapability
  isActive: boolean
  inputSchema: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

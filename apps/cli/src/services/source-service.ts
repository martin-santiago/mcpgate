import type { McpGateConfig } from '../types/config'
import { ApiService, type SourceRecord } from './api-service'
import { WorkspaceService } from './workspace-service'

export type CreateSourceInput = {
  config: Record<string, unknown>
  name: string
  type: SourceRecord['type']
}

export class SourceService {
  constructor(private readonly config: McpGateConfig) {}

  async listSources(): Promise<{ sources: SourceRecord[]; workspaceId: string }> {
    const workspaceService = new WorkspaceService(this.config)
    const workspace = await workspaceService.ensureLocalWorkspace()
    const apiService = new ApiService(this.config)
    const sources = await apiService.listSources(workspace.id)

    return { sources, workspaceId: workspace.id }
  }

  async createSource(input: CreateSourceInput): Promise<{ source: SourceRecord; workspaceId: string }> {
    const workspaceService = new WorkspaceService(this.config)
    const workspace = await workspaceService.ensureLocalWorkspace()
    const apiService = new ApiService(this.config)
    const source = await apiService.createSource(workspace.id, input)

    return { source, workspaceId: workspace.id }
  }

  async testSource(sourceId: string): Promise<{ result: { message: string; ok: boolean }; workspaceId: string }> {
    const workspaceService = new WorkspaceService(this.config)
    const workspace = await workspaceService.ensureLocalWorkspace()
    const apiService = new ApiService(this.config)
    const result = await apiService.testSource(workspace.id, sourceId)

    return { result, workspaceId: workspace.id }
  }

  async discoverSource(sourceId: string): Promise<{ result: { count: number; message: string; tools: Array<{ id: string; name: string; toolKey: string }> }; workspaceId: string }> {
    const workspaceService = new WorkspaceService(this.config)
    const workspace = await workspaceService.ensureLocalWorkspace()
    const apiService = new ApiService(this.config)
    const result = await apiService.discoverSource(workspace.id, sourceId)

    return { result, workspaceId: workspace.id }
  }
}

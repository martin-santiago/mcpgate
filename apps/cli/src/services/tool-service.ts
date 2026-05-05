import type { McpGateConfig } from '../types/config'
import { ApiService, type ToolRecord } from './api-service'
import { WorkspaceService } from './workspace-service'

export class ToolService {
  constructor(private readonly config: McpGateConfig) {}

  async listTools(): Promise<{ tools: ToolRecord[]; workspaceId: string }> {
    const workspaceService = new WorkspaceService(this.config)
    const workspace = await workspaceService.ensureLocalWorkspace()
    const apiService = new ApiService(this.config)
    const tools = await apiService.listTools(workspace.id)

    return { tools, workspaceId: workspace.id }
  }
}

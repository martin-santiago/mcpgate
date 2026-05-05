import type { McpGateConfig } from '../types/config'
import { ApiService, type WorkspaceRecord } from './api-service'

const DEFAULT_LOCAL_WORKSPACE_NAME = 'Local Workspace'

export class WorkspaceService {
  constructor(private readonly config: McpGateConfig) {}

  async ensureLocalWorkspace(): Promise<WorkspaceRecord> {
    const apiService = new ApiService(this.config)
    return apiService.ensureWorkspace(DEFAULT_LOCAL_WORKSPACE_NAME)
  }
}

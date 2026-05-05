import { Command } from '@oclif/core'

import { ConfigService } from '../../services/config-service'
import { ToolService } from '../../services/tool-service'

export default class ToolsList extends Command {
  static description = 'List tools discovered in the local workspace'

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

    const config = await configService.readConfig()
    const toolService = new ToolService(config)
    const { tools, workspaceId } = await toolService.listTools()

    this.log(`Workspace: ${workspaceId}`)

    if (tools.length === 0) {
      this.log('No tools discovered yet.')
      this.log('Next step: run `mcpgate source discover <source-id>`.')
      return
    }

    for (const tool of tools) {
      this.log(`${tool.id} | ${tool.name} | ${tool.capability} | ${tool.isActive ? 'active' : 'disabled'} | ${tool.sourceId}`)
    }
  }
}

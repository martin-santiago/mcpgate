import { Args, Command } from '@oclif/core'

import { ConfigService } from '../../services/config-service'
import { SourceService } from '../../services/source-service'

export default class SourceDiscover extends Command {
  static args = {
    sourceId: Args.string({ description: 'Source ID', required: true }),
  }

  static description = 'Discover tools for a source in the local workspace'

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

    const { args } = await this.parse(SourceDiscover)
    const config = await configService.readConfig()
    const sourceService = new SourceService(config)
    const { result, workspaceId } = await sourceService.discoverSource(args.sourceId)

    this.log(`Workspace: ${workspaceId}`)
    this.log(result.message)

    for (const tool of result.tools) {
      this.log(`- ${tool.id} | ${tool.name} | ${tool.toolKey}`)
    }
  }
}

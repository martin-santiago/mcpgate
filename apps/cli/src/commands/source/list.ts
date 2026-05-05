import { Command } from '@oclif/core'

import { ConfigService } from '../../services/config-service'
import { SourceService } from '../../services/source-service'

export default class SourceList extends Command {
  static description = 'List sources from the local workspace'

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

    const config = await configService.readConfig()
    const sourceService = new SourceService(config)
    const { sources, workspaceId } = await sourceService.listSources()

    this.log(`Workspace: ${workspaceId}`)

    if (sources.length === 0) {
      this.log('No sources found yet.')
      this.log('Next step: use `mcpgate source add ...` to create one.')
      return
    }

    for (const source of sources) {
      this.log(`${source.id} | ${source.name} | ${source.type} | ${source.status}`)
    }
  }
}

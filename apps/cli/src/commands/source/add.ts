import { Args, Command, Flags } from '@oclif/core'

import { ConfigService } from '../../services/config-service'
import type { SourceRecord } from '../../services/api-service'
import { SourceService } from '../../services/source-service'

export default class SourceAdd extends Command {
  static args = {
    name: Args.string({ description: 'Source name', required: true }),
  }

  static description = 'Add a source to the local workspace'

  static flags = {
    type: Flags.string({
      description: 'Source type',
      options: ['custom', 'supabase', 'slack', 'grafana'],
      required: true,
    }),
    url: Flags.string({ description: 'Custom source URL' }),
  }

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

    const { args, flags } = await this.parse(SourceAdd)
    const sourceConfig: Record<string, unknown> = {}

    if (flags.type === 'custom') {
      if (!flags.url) {
        this.error('Custom sources require `--url`.')
      }

      sourceConfig.url = flags.url
    }

    const sourceType = flags.type as SourceRecord['type']
    const config = await configService.readConfig()
    const sourceService = new SourceService(config)
    const { source, workspaceId } = await sourceService.createSource({
      config: sourceConfig,
      name: args.name,
      type: sourceType,
    })

    this.log(`Workspace: ${workspaceId}`)
    this.log(`Created source ${source.name} (${source.id})`)
    this.log(`- Type: ${source.type}`)
    this.log(`- Status: ${source.status}`)
  }
}

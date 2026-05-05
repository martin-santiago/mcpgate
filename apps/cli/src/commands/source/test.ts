import { Args, Command } from '@oclif/core'

import { ConfigService } from '../../services/config-service'
import { SourceService } from '../../services/source-service'

export default class SourceTest extends Command {
  static args = {
    sourceId: Args.string({ description: 'Source ID', required: true }),
  }

  static description = 'Test a source connection from the local workspace'

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

    const { args } = await this.parse(SourceTest)
    const config = await configService.readConfig()
    const sourceService = new SourceService(config)
    const { result, workspaceId } = await sourceService.testSource(args.sourceId)

    this.log(`Workspace: ${workspaceId}`)
    this.log(`Result: ${result.ok ? 'OK' : 'FAIL'}`)
    this.log(`Message: ${result.message}`)
  }
}

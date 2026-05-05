import { Command } from '@oclif/core'

import { ConfigService } from '../services/config-service'
import { LocalServiceManager } from '../services/local-service-manager'

export default class Start extends Command {
  static description = 'Start the local MCPGate environment'

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

  const config = await configService.readConfig()
    await configService.ensureHomeStructure(config)

    this.log('Starting MCPGate local services...')
    this.log('This initial slice boots the current API and companion dashboard.')

    const localServiceManager = new LocalServiceManager()
    await localServiceManager.start(config)
  }
}

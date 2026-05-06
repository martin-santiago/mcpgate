import { Command, Flags } from '@oclif/core'

import { ConfigService } from '../services/config-service'
import { LocalServiceManager } from '../services/local-service-manager'

export default class Start extends Command {
  static description = 'Start the local MCPGate environment'

  static flags = {
    'api-only': Flags.boolean({
      default: false,
      description: 'Start only the local API and skip the companion dashboard',
    }),
    timeout: Flags.integer({
      default: 30,
      description: 'Seconds to wait for service readiness',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Start)
    const configService = new ConfigService()

    if (!(await configService.hasConfig())) {
      this.error('MCPGate is not initialized yet. Run `mcpgate init` first.')
    }

    if (flags.timeout <= 0) {
      this.error('Timeout must be greater than 0 seconds.')
    }

    const config = await configService.readConfig()
    await configService.ensureHomeStructure(config)

    this.log('Starting MCPGate local services...')
    this.log(
      flags['api-only']
        ? 'API-only mode enabled: skipping the companion dashboard.'
        : 'This initial slice boots the current API and companion dashboard.',
    )

    const localServiceManager = new LocalServiceManager()
    await localServiceManager.start(config, {
      apiOnly: flags['api-only'],
      readinessTimeoutMs: flags.timeout * 1_000,
    })
  }
}

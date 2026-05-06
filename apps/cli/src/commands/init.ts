import { Command } from '@oclif/core'

import { ConfigService } from '../services/config-service'

export default class Init extends Command {
  static description = 'Initialize the local MCPGate home directory'

  async run(): Promise<void> {
    const configService = new ConfigService()

    if (await configService.hasConfig()) {
      await configService.readConfig()
      this.log('MCPGate is already initialized.')
      this.log('Use `mcpgate doctor` to inspect the current local setup.')
      return
    }

    const { config, configPath } = await configService.writeDefaultConfig()

    this.log('Initialized MCPGate local home.')
    this.log(`- Config: ${configPath}`)
    this.log(`- Data: ${config.paths.dataDir}`)
    this.log(`- Logs: ${config.paths.logsDir}`)
    this.log(`- Storage: ${config.storage.mode} (${config.storage.sqlitePath})`)
    this.log('Next step: run `mcpgate doctor` and then `mcpgate start`.')
  }
}

import { Command } from '@oclif/core'

import { ConfigService } from '../services/config-service'
import { DoctorService } from '../services/doctor-service'
import { OutputService } from '../services/output-service'

export default class Doctor extends Command {
  static description = 'Run local MCPGate diagnostics'

  async run(): Promise<void> {
    const configService = new ConfigService()
    const doctorService = new DoctorService()
    const outputService = new OutputService()

    const config = (await configService.hasConfig()) ? await configService.readConfig() : undefined
    const checks = await doctorService.run(config)

    outputService.printDoctorChecks(checks)
  }
}

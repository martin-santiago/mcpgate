import type { DoctorCheck, DoctorCheckStatus } from '../types/config'

function statusSymbol(status: DoctorCheckStatus): string {
  if (status === 'pass') return 'OK'
  if (status === 'warn') return 'WARN'
  return 'FAIL'
}

export class OutputService {
  printDoctorChecks(checks: DoctorCheck[]): void {
    for (const check of checks) {
      process.stdout.write(`[${statusSymbol(check.status)}] ${check.label}: ${check.details}\n`)
    }
  }
}

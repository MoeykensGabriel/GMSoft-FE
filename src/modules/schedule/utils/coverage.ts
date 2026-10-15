import type { Coverage } from '../services/scheduleService'

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export function coverageMessage(coverage: Coverage): string {
  if (coverage.covered !== false) return ''
  return coverage.days.filter((day) => day.matches === false).map((day) =>
    `${days[day.day - 1]}: ${day.scheduledZoneId ? `el camión hace ${day.scheduledZoneName ?? 'la zona de la agenda'}` : 'el camión no sale según la agenda'}.`).join(' ')
}
export function coverageOptions(coverage: Coverage) {
  return coverage.days.filter((day, index, all) => day.matches === false && day.scheduledZoneId &&
    all.findIndex((other) => other.scheduledZoneId === day.scheduledZoneId) === index)
}

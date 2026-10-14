import { BUSINESS_TIME_ZONE } from '../../core'

export function restockTime(occurredAt: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(occurredAt))
}

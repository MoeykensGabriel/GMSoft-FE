import { BUSINESS_TIME_ZONE } from '../../core'
import type { SessionRestock } from '../services/sessionService'

export function restockTime(occurredAt: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(occurredAt))
}

export function restockProducts(restock: SessionRestock) {
  return restock.items.map((item) => `${item.quantity} × ${item.productDetail}`).join(' y ')
}

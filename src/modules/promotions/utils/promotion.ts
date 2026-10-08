import type { Promotion, Prospect } from '../services/promotionService'

// Una fecha local no se convierte a UTC ni a la zona del dispositivo.
export function pickupLabel(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}
export function validProspect(value: Prospect) {
  return value.contactName.trim().length > 0 && value.contactName.length <= 150
    && value.phone.trim().length > 0 && value.phone.length <= 30
    && value.address.trim().length > 0 && value.address.length <= 300
    && (value.businessName?.length ?? 0) <= 200 && (value.notes?.length ?? 0) <= 1000
    && value.visitDays.length > 0 && new Set(value.visitDays).size === value.visitDays.length
    && value.visitDays.every((day) => Number.isInteger(day) && day >= 1 && day <= 7)
}
export function sortPending(promotions: Promotion[]) {
  return [...promotions].sort((a, b) => a.pickupDate.localeCompare(b.pickupDate)
    || a.registeredAt.localeCompare(b.registeredAt) || a.id.localeCompare(b.id))
}

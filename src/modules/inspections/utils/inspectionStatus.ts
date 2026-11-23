import { noPurchaseLabel } from '../../customers'
import type { InspectionCustomer, NotBuyingReason } from '../services/inspectionService'

export const NOT_BUYING_REASONS: Record<NotBuyingReason, string> = {
  BuysElsewhere: 'Compra en otro lado',
  Moved: 'Se mudó / cerró',
  DoesNotWant: 'No quiere más',
  Other: 'Otro',
}

/** Estado del control, para pintar la tarjeta: sin controlar, al día, corregido o perdido. */
export type InspectionTone = 'pending' | 'ok' | 'fixed' | 'lost'

export function inspectionTone(customer: InspectionCustomer): InspectionTone {
  return customer.inspection ? toneOf(customer.inspection) : 'pending'
}

/** Rojo si no compra; naranja si hubo que corregir envases; verde si estaba todo bien. */
export function toneOf(done: { stillBuys: boolean; containers: { systemQuantity: number; realQuantity: number }[] }): InspectionTone {
  if (!done.stillBuys) return 'lost'
  return done.containers.some((c) => c.realQuantity !== c.systemQuantity) ? 'fixed' : 'ok'
}

export const TONE_BORDER: Record<InspectionTone, string> = {
  pending: 'border-l-line',
  ok: 'border-l-success',
  fixed: 'border-l-orange-500',
  lost: 'border-l-danger',
}

export function driverVisitLabel(customer: Pick<InspectionCustomer, 'driverVisit'>): { text: string; tone: 'success' | 'info' | 'warning' | 'neutral' } {
  const visit = customer.driverVisit
  if (!visit) return { text: 'Sin visitar', tone: 'neutral' }
  if (visit.type === 'Sale') return { text: 'Vendió', tone: 'success' }
  if (visit.type === 'NoPurchase') return { text: `No compró: ${noPurchaseLabel(visit.noPurchaseReason)}`, tone: 'warning' }
  return { text: 'Solo envases', tone: 'info' }
}

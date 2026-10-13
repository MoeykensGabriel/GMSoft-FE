export const NO_PURCHASE_REASONS = {
  NotHome: 'No estaba',
  StillHasProduct: 'Todavía tiene producto',
  DidNotWant: 'No quiso',
  NoMoney: 'Sin dinero',
  BuysElsewhere: 'Compra a otro proveedor',
  Other: 'Otro',
} as const

export type NoPurchaseReason = keyof typeof NO_PURCHASE_REASONS
export interface LastNoPurchase { date: string; reason: NoPurchaseReason; notes: string | null }

export function noPurchaseLabel(reason: NoPurchaseReason | null | undefined): string {
  return reason ? NO_PURCHASE_REASONS[reason] ?? 'Motivo no informado' : 'Motivo no informado'
}

export function validNoPurchase(reason: NoPurchaseReason | null, notes: string): boolean {
  return reason !== null && Object.hasOwn(NO_PURCHASE_REASONS, reason)
    && notes.length <= 300 && (reason !== 'Other' || notes.trim().length > 0)
}

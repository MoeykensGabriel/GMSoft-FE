export const REMOVAL_REASONS = {
  Moved: 'Se mudó',
  ClosedBusiness: 'Cerró el negocio',
  NoLongerWants: 'No quiere más el servicio',
  Deceased: 'Falleció',
  Other: 'Otro',
} as const

export type RemovalReason = keyof typeof REMOVAL_REASONS
export type RemovalStatus = 'Pending' | 'Confirmed' | 'Rejected'

export function removalLabel(reason: RemovalReason | null | undefined): string {
  return reason ? REMOVAL_REASONS[reason] ?? 'Motivo no informado' : 'Motivo no informado'
}

/** Un motivo válido; "Otro" exige nota. Con envases hay que marcar que no los devolvió. */
export function validRemoval(reason: RemovalReason | null, notes: string, hasContainers: boolean, notReturned: boolean): boolean {
  return reason !== null && Object.hasOwn(REMOVAL_REASONS, reason)
    && notes.length <= 300 && (reason !== 'Other' || notes.trim().length > 0)
    && (!hasContainers || notReturned)
}

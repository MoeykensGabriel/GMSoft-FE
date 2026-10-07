/**
 * Como viene comprando un cliente, en turnos: cada semana en que el camion paso y
 * no le vendio es un turno perdido. Una semana sin reparto no cuenta.
 */
export function purchaseActivityLabel(weeksWithoutPurchase: number, neverPurchased: boolean): string {
  const turnos = weeksWithoutPurchase === 0
    ? null
    : `${weeksWithoutPurchase} ${weeksWithoutPurchase === 1 ? 'semana' : 'semanas'} sin comprar`

  if (neverPurchased) return turnos ? `Sin compras registradas · ${turnos}` : 'Sin compras registradas'
  return turnos ?? 'Compra al día'
}

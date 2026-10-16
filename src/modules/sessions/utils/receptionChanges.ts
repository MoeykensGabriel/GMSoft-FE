import { formatMoney } from '../../core'
import type { ReceptionCorrection } from '../services/sessionService'

/** Cada dato que cambió en una corrección de la recepción, con el antes y el después. */
export function correctionChanges(c: ReceptionCorrection): string[] {
  return [
    ...(c.newKilometers !== null ? [`Kilometraje de vuelta: ${c.previousKilometers ?? '—'} → ${c.newKilometers} km`] : []),
    ...(c.newAmountReceived !== null
      ? [`Plata rendida: ${c.previousAmountReceived === null ? '—' : formatMoney(c.previousAmountReceived)} → ${formatMoney(c.newAmountReceived)}`]
      : []),
    ...c.lines.map((l) =>
      `${l.productDetail}, ${l.state === 'Full' ? 'llenos' : 'vacíos'} descargados: ${l.previousQuantity} → ${l.newQuantity}`),
  ]
}

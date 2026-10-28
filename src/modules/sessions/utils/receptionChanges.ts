import { formatMoney } from '../../core'
import type { CorrectReceptionRequest, Reception, ReceptionCorrection } from '../services/sessionService'

type Changes = Pick<ReceptionCorrection, 'previousKilometers' | 'newKilometers' | 'previousAmountReceived' | 'newAmountReceived' | 'lines'>

/** Cada dato que cambió en una corrección de la recepción, con el antes y el después. */
export function correctionChanges(c: Changes): string[] {
  return [
    ...(c.newKilometers !== null ? [`Kilometraje de vuelta: ${c.previousKilometers ?? '—'} → ${c.newKilometers} km`] : []),
    ...(c.newAmountReceived !== null
      ? [`Plata rendida: ${c.previousAmountReceived === null ? '—' : formatMoney(c.previousAmountReceived)} → ${formatMoney(c.newAmountReceived)}`]
      : []),
    ...c.lines.map((l) =>
      `${l.productDetail}, ${l.state === 'Full' ? 'llenos' : 'vacíos'} descargados: ${l.previousQuantity} → ${l.newQuantity}`),
  ]
}

/**
 * Lo que va a cambiar si se confirma la corrección, con las mismas frases con que
 * después aparece en el historial de la salida.
 */
export function pendingCorrectionChanges(reception: Reception, request: CorrectReceptionRequest): string[] {
  return correctionChanges({
    previousKilometers: reception.kilometersAtClose,
    newKilometers: request.kilometersAtClose,
    previousAmountReceived: reception.amountReceived,
    newAmountReceived: request.amountReceived,
    lines: request.returns.flatMap((r) => {
      const product = reception.products.find((p) => p.productId === r.productId)
      return product ? [{
        productId: r.productId, productDetail: product.productDetail, state: r.state,
        previousQuantity: r.state === 'Full' ? product.fullReturned : product.emptyReturned, newQuantity: r.quantity,
      }] : []
    }),
  })
}

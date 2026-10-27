import type { SessionStockLine } from '../services/sessionService'

export interface ReceptionDifference {
  productId: string
  productDetail: string
  /** Positivo sobra, negativo falta. */
  difference: number
}

/**
 * Cómo quedó una salida recibida, separado en llenos y vacíos. Lo que quedó colgado a
 * bordo en positivo falta (salió y no volvió) y se muestra en negativo; en negativo
 * sobra y se muestra en positivo. Una lista vacía es que ese estado cuadró.
 */
export function receptionDifferences(stock: SessionStockLine[]): { full: ReceptionDifference[]; empty: ReceptionDifference[] } {
  const by = (onBoard: (line: SessionStockLine) => number) => stock
    .filter((line) => onBoard(line) !== 0)
    .map((line) => ({ productId: line.productId, productDetail: line.productDetail, difference: -onBoard(line) }))
  return { full: by((line) => line.fullOnBoard), empty: by((line) => line.emptyOnBoard) }
}

/** "+12" si sobra, "−7" si falta, con el signo menos tipográfico. */
export function signedDifference(difference: number): string {
  return difference > 0 ? `+${difference}` : `−${Math.abs(difference)}`
}

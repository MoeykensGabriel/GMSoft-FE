import type { ActiveDeparture } from '../services/sessionService'

export interface DepartureRow {
  productId: string
  productDetail: string
  initial: number
  restocked: number
  delivered: number
  fullOnBoard: number
  emptyOnBoard: number
}

/**
 * Las filas de la tarjeta de un camión en la calle. Un backend anterior solo manda la
 * carga inicial: entonces se muestra eso, sin inventar lo que lleva a bordo.
 */
export function departureRows(departure: ActiveDeparture): DepartureRow[] {
  if (departure.stock?.length) return departure.stock
  return departure.initialLoad.map((line) => ({
    productId: line.productId, productDetail: line.productDetail,
    initial: line.quantity, restocked: 0, delivered: 0, fullOnBoard: line.quantity, emptyOnBoard: 0,
  }))
}

/** Sin llenos a bordo, o con menos de una quinta parte de lo que llevó: avisa que se está quedando sin. */
export function stockTone(row: DepartureRow): 'empty' | 'low' | 'ok' {
  const llevo = row.initial + row.restocked
  if (llevo > 0 && row.fullOnBoard <= 0) return 'empty'
  if (llevo > 0 && row.fullOnBoard * 5 < llevo) return 'low'
  return 'ok'
}

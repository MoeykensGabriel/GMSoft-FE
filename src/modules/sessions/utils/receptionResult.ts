import type { SessionStockLine } from '../services/sessionService'

/**
 * Cómo quedó una salida recibida, en palabras: lo que quedó colgado en positivo falta
 * (salió y no volvió), en negativo sobra. Vacío es que cuadró.
 */
export function receptionDifferences(stock: SessionStockLine[]): string[] {
  return stock.flatMap((line) => [
    [line.fullOnBoard, 'lleno', 'llenos'] as const,
    [line.emptyOnBoard, 'vacío', 'vacíos'] as const,
  ].filter(([cantidad]) => cantidad !== 0).map(([cantidad, uno, varios]) => {
    const n = Math.abs(cantidad)
    return `${cantidad > 0 ? (n === 1 ? 'Falta' : 'Faltan') : (n === 1 ? 'Sobra' : 'Sobran')} ${n} ${n === 1 ? uno : varios} de ${line.productDetail}`
  }))
}

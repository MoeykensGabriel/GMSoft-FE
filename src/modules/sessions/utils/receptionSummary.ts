import type { SessionStockLine } from '../services/sessionService'

export interface CountedLine {
  productId: string
  llenos: number
  vacios: number
}

/** Un producto cuyo conteo no coincide con lo que debía volver. Negativo: faltan; positivo: sobran. */
export interface ContainerGap {
  productId: string
  productDetail: string
  llenos: number
  vacios: number
}

/**
 * Lo que no cuadra entre lo contado y lo que debía volver en el camión. Un producto que
 * no se contó cuenta como cero: en el resumen tiene que verse que falta todo.
 */
export function containerGaps(stock: SessionStockLine[], contado: CountedLine[]): ContainerGap[] {
  return stock.flatMap((s) => {
    const linea = contado.find((l) => l.productId === s.productId)
    const llenos = (linea?.llenos ?? 0) - s.fullOnBoard
    const vacios = (linea?.vacios ?? 0) - s.emptyOnBoard
    return llenos === 0 && vacios === 0 ? [] : [{ productId: s.productId, productDetail: s.productDetail, llenos, vacios }]
  })
}

/** «faltan 2 llenos · sobra 1 vacío» */
export function describeGap(gap: ContainerGap): string {
  const parte = (n: number, uno: string, varios: string) => {
    if (n === 0) return null
    const cantidad = Math.abs(n)
    const verbo = n < 0 ? (cantidad === 1 ? 'falta' : 'faltan') : (cantidad === 1 ? 'sobra' : 'sobran')
    return `${verbo} ${cantidad} ${cantidad === 1 ? uno : varios}`
  }
  return [parte(gap.llenos, 'lleno', 'llenos'), parte(gap.vacios, 'vacío', 'vacíos')].filter(Boolean).join(' · ')
}

/** Efectivo cobrado menos entregado: positivo es plata que falta. */
export function cashGap(expected: number, received: number): number {
  // `+ 0` convierte -0 en 0: una diferencia de centavos redondeada no es un faltante.
  return Math.round((expected - received) * 100) / 100 + 0
}

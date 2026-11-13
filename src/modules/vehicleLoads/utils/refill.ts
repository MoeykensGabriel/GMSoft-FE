import type { Product } from '../../products'
import type { SessionStockLine } from '../../sessions'
import type { LoadLine } from '../components/LoadEditor'

export interface RefillOption {
  productId: string
  productDetail: string
  /** Vacíos de ese producto arriba del camión ahora. */
  emptyOnBoard: number
  /** No se rellenan más vacíos que los que hay ni que los llenos que suben. */
  max: number
}

/** Los productos de la recarga que tienen envase y vacíos arriba del camión. */
export function refillOptions(items: LoadLine[], products: Pick<Product, 'id' | 'detail' | 'tracking'>[],
  stock: SessionStockLine[]): RefillOption[] {
  return items.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId)
    const emptyOnBoard = stock.find((s) => s.productId === line.productId)?.emptyOnBoard ?? 0
    if (!product || product.tracking === 'None' || emptyOnBoard <= 0 || line.quantity <= 0) return []
    return [{ productId: line.productId, productDetail: product.detail, emptyOnBoard,
      max: Math.min(line.quantity, emptyOnBoard) }]
  })
}

/** Junta la recarga con los vacíos rellenados; descarta los que ya no corresponden. */
export function withRefills(items: LoadLine[], refills: Record<string, number>,
  options: RefillOption[]): (LoadLine & { refilledEmpties?: number })[] {
  return items.map((line) => {
    const option = options.find((o) => o.productId === line.productId)
    const refilled = option ? Math.min(Math.max(0, Math.floor(refills[line.productId] ?? 0)), option.max) : 0
    return refilled > 0 ? { ...line, refilledEmpties: refilled } : { ...line }
  })
}

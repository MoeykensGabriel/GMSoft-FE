export interface RouteProgress {
  total: number
  sold: number
  noPurchase: number
  pending: number
}

/**
 * Avance de la salida sobre los clientes del recorrido. Separa los que compraron de los
 * visitados sin compra: llegar al final marcando "no compró" no se ve como un buen día.
 * Solo cuenta clientes de la hoja; las ventas fuera de recorrido no la llenan.
 */
export function routeProgress(
  customerIds: readonly string[], visitedIds: readonly string[], noPurchaseIds: readonly string[],
): RouteProgress {
  const visited = new Set(visitedIds)
  const noPurchase = new Set(noPurchaseIds)
  const ids = new Set(customerIds)
  let sold = 0
  let without = 0
  for (const id of ids) {
    if (!visited.has(id)) continue
    if (noPurchase.has(id)) without++
    else sold++
  }
  return { total: ids.size, sold, noPurchase: without, pending: ids.size - sold - without }
}

/** Porcentaje entero de una parte, sin pasarse de 100. */
export function share(part: number, total: number): number {
  return total > 0 ? Math.min(100, (part / total) * 100) : 0
}

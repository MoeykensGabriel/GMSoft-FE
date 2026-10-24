/** Cuánto hay arriba del camión de cada producto, sumando las tandas en que se cargó. */
export function totalsByProduct(lines: { productId: string; quantity: number }[]): Record<string, number> {
  const totales: Record<string, number> = {}
  for (const line of lines) totales[line.productId] = (totales[line.productId] ?? 0) + line.quantity
  return totales
}

/** Lo que se manda al guardar: solo los productos que quedan con algo arriba. */
export function draftItems(draft: Record<string, number>) {
  return Object.entries(draft).filter(([, quantity]) => quantity > 0).map(([productId, quantity]) => ({ productId, quantity }))
}

/** Si la tabla editada dice lo mismo que lo que ya está arriba. */
export function sameLoad(draft: Record<string, number>, current: Record<string, number>) {
  const ids = new Set([...Object.keys(draft), ...Object.keys(current)])
  return [...ids].every((id) => (draft[id] ?? 0) === (current[id] ?? 0))
}

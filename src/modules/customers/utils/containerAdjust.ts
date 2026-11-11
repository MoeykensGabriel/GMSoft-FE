/** Lo que cambió en el conteo: solo los productos cuya cantidad real difiere de la registrada. */
export function changedCounts(
  current: Readonly<Record<string, number>>, counted: Readonly<Record<string, number>>,
): { productId: string; realQuantity: number }[] {
  return Object.entries(counted)
    .filter(([productId, quantity]) => Number.isInteger(quantity) && quantity >= 0 && quantity !== (current[productId] ?? 0))
    .map(([productId, realQuantity]) => ({ productId, realQuantity }))
}

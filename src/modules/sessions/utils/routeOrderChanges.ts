interface RouteRow { id: string; displayName: string }

/** Posiciones visibles (desde 1), no los huecos del RouteOrder persistido. */
export function routeOrderChanges(original: readonly RouteRow[], ordered: readonly RouteRow[]) {
  const positions = new Map(original.map((row, index) => [row.id, index + 1]))
  return ordered.flatMap((row, index) => {
    const from = positions.get(row.id)
    const to = index + 1
    return from !== undefined && from !== to ? [{ id: row.id, displayName: row.displayName, from, to }] : []
  })
}

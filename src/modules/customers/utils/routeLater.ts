/** Lo vuelve a poner último: posponer de nuevo lo manda otra vez al final. */
export function postpone(ids: readonly string[], customerId: string): string[] {
  return [...ids.filter((id) => id !== customerId), customerId]
}

/**
 * Reparte la hoja del chofer: los pendientes en orden de recorrido, después los que
 * pidieron que vuelva más tarde (en el orden en que se pospusieron) y aparte los ya
 * visitados. Una visita le gana a «más tarde»: el que ya se visitó no vuelve a aparecer.
 */
export function splitRoute<T extends { id: string }>(
  customers: readonly T[], visitedIds: readonly string[], laterIds: readonly string[],
): { pending: T[]; later: T[]; visited: T[] } {
  const visited = new Set(visitedIds)
  const later = new Set(laterIds)
  const byId = new Map(customers.map((customer) => [customer.id, customer]))
  return {
    pending: customers.filter((customer) => !visited.has(customer.id) && !later.has(customer.id)),
    later: laterIds.filter((id) => !visited.has(id)).flatMap((id) => byId.get(id) ?? []),
    visited: customers.filter((customer) => visited.has(customer.id)),
  }
}

const normal = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** La búsqueda de la hoja, para los pospuestos que se traen fuera de la lista paginada. */
export function matchesSearch(customer: { displayName: string; address: string; phone?: string | null }, search: string): boolean {
  const term = normal(search.trim())
  return !term || [customer.displayName, customer.address, customer.phone ?? ''].some((field) => normal(field).includes(term))
}

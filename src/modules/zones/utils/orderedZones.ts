export interface OrderedZone { zoneId: string; zoneName: string | null }

export function orderedZones(value?: { zones?: OrderedZone[]; zoneId?: string | null; zoneName?: string | null } | null): OrderedZone[] {
  return value?.zones ?? (value?.zoneId ? [{ zoneId: value.zoneId, zoneName: value.zoneName ?? null }] : [])
}

export const sameZones = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index])
export const addZone = (ids: string[], id: string) => !id || ids.includes(id) || ids.length >= 5 ? ids : [...ids, id]
export const removeZone = (ids: string[], id: string) => ids.filter((value) => value !== id)
export function moveZone(ids: string[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/**
 * Las zonas que se pueden agregar, con cuántos clientes tiene el camión en cada una.
 * Sin conteos, todas por nombre como siempre. Con conteos, primero las que tienen
 * clientes (de más a menos) y después las vacías, que no le muestran nada al chofer.
 */
export function zoneChoices(options: { id: string; name: string; isActive: boolean }[], value: string[], counts?: Record<string, number>) {
  const libres = options.filter((zone) => zone.isActive && !value.includes(zone.id))
  if (!counts) return libres.map((zone) => ({ id: zone.id, label: zone.name, customers: null as number | null }))
  return libres.map((zone) => ({ id: zone.id, name: zone.name, customers: counts[zone.id] ?? 0 }))
    .sort((a, b) => b.customers - a.customers || a.name.localeCompare(b.name, 'es'))
    .map(({ id, name, customers }) => ({ id, customers: customers as number | null,
      label: customers ? `${name} — ${customers} ${customers === 1 ? 'cliente' : 'clientes'} hoy` : `${name} (sin clientes hoy)` }))
}

export function zoneBlocks<T extends { zoneId: string }>(zones: OrderedZone[], customers: T[]) {
  return zones.map((zone) => ({ ...zone, customers: customers.filter((customer) => customer.zoneId === zone.zoneId) }))
}

export function zonesLabel(value: { zones?: OrderedZone[]; zoneId: string; zoneName: string }) {
  const zones = orderedZones(value)
  return `${zones.length > 1 ? 'Zonas: ' : ''}${zones.map((zone) => zone.zoneName).join(' → ')}`
}

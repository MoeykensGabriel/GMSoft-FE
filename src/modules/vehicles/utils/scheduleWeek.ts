import type { ScheduleCustomerCount } from '../../schedule'

export interface WeekDay { day: number; zoneIds: string[] }

/** Cuántos clientes de esa zona hay ese día; cero si ninguno. */
export function customersFor(counts: ScheduleCustomerCount[], day: number, zoneId: string) {
  return counts.find((c) => c.day === day && c.zoneId === zoneId)?.customers ?? 0
}

/** Las zonas que tienen clientes ese día y no están en la agenda, de la que más tiene a la que menos. */
export function unscheduled(counts: ScheduleCustomerCount[], day: number, zoneIds: string[]) {
  return counts.filter((c) => c.day === day && !zoneIds.includes(c.zoneId))
    .sort((a, b) => b.customers - a.customers || a.zoneName.localeCompare(b.zoneName, 'es'))
}

/** La semana completa con un solo día cambiado: el backend guarda siempre los siete. */
export function replaceDay(week: WeekDay[], day: number, zoneIds: string[]): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => i + 1).map((d) => ({
    day: d, zoneIds: d === day ? zoneIds : week.find((w) => w.day === d)?.zoneIds ?? [],
  }))
}

/** «Tafí Viejo (58)», o solo el nombre si ese día no tiene clientes ahí. */
export function zoneWithCount(name: string, customers: number) {
  return customers > 0 ? `${name} (${customers})` : name
}

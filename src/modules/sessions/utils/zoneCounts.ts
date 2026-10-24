import type { ScheduleCustomerCount } from '../../schedule'

/**
 * Clientes del camión por zona para los días de la salida. Si la salida cubre más de
 * un día, se toma el día con más clientes de cada zona: sumarlos contaría dos veces a
 * quien se visita los dos días.
 */
export function zoneCountsForDays(counts: ScheduleCustomerCount[], days: number[], today: number): Record<string, number> {
  // Sin carga todavía no hay días de recorrido: se toma el día de hoy.
  const dias = days.length ? days : [today]
  const porZona: Record<string, number> = {}
  for (const c of counts)
    if (dias.includes(c.day)) porZona[c.zoneId] = Math.max(porZona[c.zoneId] ?? 0, c.customers)
  return porZona
}

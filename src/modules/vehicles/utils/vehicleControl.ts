export type KilometersStatus = { tone: 'success' | 'warning'; label: string; detail: string | null }

/**
 * En qué está la revisión del km de un camión. Verde solo cuando la oficina aceptó una
 * lectura y no hay otra esperando; si no, ámbar con lo que falta.
 */
export function kilometersStatus(
  vehicle: { kilometersCheckPending?: boolean; kilometersCheckedAt?: string | null },
  awaitingReview: boolean,
): KilometersStatus {
  if (awaitingReview) return { tone: 'warning', label: 'Esperando revisión', detail: 'El chofer ya leyó el tablero: revisalo en Alertas.' }
  if (vehicle.kilometersCheckPending) return { tone: 'warning', label: 'Sin revisar', detail: 'En la próxima salida el chofer lee el tablero.' }
  if (vehicle.kilometersCheckedAt) return { tone: 'success', label: 'Km revisado', detail: null }
  return { tone: 'warning', label: 'Sin revisar', detail: null }
}

/** Los últimos `days` días hasta hoy inclusive, en fechas AAAA-MM-DD. */
export function lastDays(today: string, days: number) {
  const [y, m, d] = today.split('-').map(Number)
  const from = new Date(Date.UTC(y, m - 1, d - (days - 1)))
  return { from: from.toISOString().slice(0, 10), to: today }
}

/** «1.234,5 km», o «—» si no hay dato. */
export function kmLabel(value: number | null | undefined) {
  return value == null ? '—' : `${value.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`
}

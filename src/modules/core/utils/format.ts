const LOCALE = 'es-AR'

/** Importes en pesos. El backend manda decimal, aca solo se muestra. */
export function formatMoney(monto: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(monto)
}

/**
 * El backend guarda y devuelve todo en UTC. Intl lo pasa a la zona del navegador,
 * que es lo que el usuario espera ver.
 */
export function formatDate(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short' }).format(d)
}

export function formatDateTime(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

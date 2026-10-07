const LOCALE = 'es-AR'

/** La zona horaria del negocio. Lo que es "hoy" se decide aca, no en el dispositivo. */
export const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires'

/** El dia del negocio como YYYY-MM-DD, que es lo que espera un input de fecha. */
export function currentBusinessDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

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

export function formatDateTime(fecha: string | Date, timeZone?: string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  }).format(d)
}

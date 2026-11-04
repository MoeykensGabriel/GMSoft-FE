/** «Día 12 · desde 24/10/2026». La fecha llega como día de negocio, sin hora: no pasa por la zona del navegador. */
export function usageSinceLabel(since: string | null, days: number | null): string | null {
  if (!since || !days) return null
  const [year, month, day] = since.split('-')
  return `Día ${days} · desde ${day}/${month}/${year}`
}

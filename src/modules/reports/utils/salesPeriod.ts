export type SalesPeriodKind = 'week' | 'month'
export interface SalesPeriodRange { from: string; to: string }

const DAY = 86_400_000
const iso = (date: Date) => date.toISOString().slice(0, 10)
const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/** Fechas de negocio: UTC evita depender del huso horario del dispositivo. */
export function periodFor(kind: SalesPeriodKind, today: string): SalesPeriodRange {
  const date = new Date(`${today}T00:00:00Z`)
  if (kind === 'week') {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
    return { from: iso(date), to: iso(new Date(date.getTime() + 6 * DAY)) }
  }
  date.setUTCDate(1)
  const from = iso(date)
  date.setUTCMonth(date.getUTCMonth() + 1)
  return { from, to: iso(new Date(date.getTime() - DAY)) }
}

export function shiftPeriod(kind: SalesPeriodKind, range: SalesPeriodRange, delta: -1 | 1): SalesPeriodRange {
  const date = new Date(`${range.from}T00:00:00Z`)
  if (kind === 'week') date.setUTCDate(date.getUTCDate() + delta * 7)
  else {
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + delta)
  }
  return periodFor(kind, iso(date))
}

export function periodTitle(kind: SalesPeriodKind, range: SalesPeriodRange): string {
  const shortDate = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}`
  if (kind === 'week') return `Semana del ${shortDate(range.from)} al ${shortDate(range.to)}`
  return `${months[Number(range.from.slice(5, 7)) - 1]} ${range.from.slice(0, 4)}`
}

export function isCurrentPeriod(kind: SalesPeriodKind, range: SalesPeriodRange, today: string): boolean {
  const current = periodFor(kind, today)
  return range.from === current.from && range.to === current.to
}

/** Título del rango: el del período si coincide justo, si no "Del dd/mm/aaaa al dd/mm/aaaa". */
export function rangeTitle(kind: SalesPeriodKind, range: SalesPeriodRange): string {
  const exact = periodFor(kind, range.from)
  if (exact.from === range.from && exact.to === range.to) return periodTitle(kind, range)
  const longDate = (value: string) => value.split('-').reverse().join('/')
  return range.from === range.to ? `El ${longDate(range.from)}` : `Del ${longDate(range.from)} al ${longDate(range.to)}`
}

/** Porcentaje escrito por el usuario ("1", "1,5", "0.25"). Null si no es un número entre 0 y 100. */
export function parsePercent(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(normalized)) return null
  const value = Number(normalized)
  return value <= 100 ? value : null
}

/** Monto del porcentaje sobre el total, redondeado a centavos. */
export function percentAmount(total: number, percent: number): number {
  return Math.round(total * percent) / 100
}

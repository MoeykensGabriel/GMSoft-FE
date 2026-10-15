export type Period = 'week' | 'month' | 'previousMonth' | 'custom'
export interface DateRange { from: string; to: string }

const DAY = 86_400_000
const iso = (date: Date) => date.toISOString().slice(0, 10)

/** Opera sobre fechas de negocio, sin depender de la zona horaria del dispositivo. */
export function periodRange(period: Exclude<Period, 'custom'>, today: string): DateRange {
  const date = new Date(`${today}T00:00:00Z`)
  if (period === 'week') {
    const monday = new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * DAY)
    return { from: iso(monday), to: iso(new Date(monday.getTime() + 6 * DAY)) }
  }
  date.setUTCDate(1)
  if (period === 'previousMonth') date.setUTCMonth(date.getUTCMonth() - 1)
  const from = iso(date)
  date.setUTCMonth(date.getUTCMonth() + 1)
  return { from, to: iso(new Date(date.getTime() - DAY)) }
}

export function rangeError({ from, to }: DateRange): string | null {
  for (const value of [from, to]) {
    const date = new Date(`${value}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime())
      || iso(date) !== value || value <= '0001-01-01' || value >= '9999-12-31') {
      return 'Elegí dos fechas válidas.'
    }
  }
  if (from > to) return 'La fecha desde no puede ser posterior a la fecha hasta.'
  if ((Date.parse(to) - Date.parse(from)) / DAY + 1 > 366) return 'El período no puede superar los 366 días.'
  return null
}

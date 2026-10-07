export const WEEKDAYS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 7, label: 'Domingo' },
]

export function weekdayLabels(days: number[]) {
  return WEEKDAYS.filter((day) => days.includes(day.value)).map((day) => day.label).join(', ')
}

/** Día del negocio, independiente de la zona horaria del teléfono. */
export function currentBusinessWeekday(now = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short',
  }).format(now)
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday) + 1
}

/** Día ISO (lunes=1 a domingo=7) de una fecha de calendario `YYYY-MM-DD`. */
export function weekdayOfDate(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).getDay() || 7
}

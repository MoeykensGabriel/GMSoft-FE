import type { WorkingDay, WorkingHours } from './types'

export const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export function draftDays(hours: WorkingHours): WorkingDay[] {
  return hours.isConfigured
    ? [...hours.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((day) => ({ ...day,
      from: day.from?.slice(0, 5) ?? null, until: day.until?.slice(0, 5) ?? null,
      openingCutoff: day.openingCutoff?.slice(0, 5) ?? null }))
    : dayNames.map((_, index) => ({ dayOfWeek: index + 1, isWorkingDay: index < 6,
      from: index < 6 ? '08:00' : null, until: index < 5 ? '18:00' : index === 5 ? '13:00' : null, openingCutoff: null }))
}
export function validateDays(days: WorkingDay[]): Record<string, string> {
  const errors: Record<string, string> = {}
  if (days.length !== 7 || new Set(days.map((d) => d.dayOfWeek)).size !== 7 || days.some((d) => !Number.isInteger(d.dayOfWeek) || d.dayOfWeek < 1 || d.dayOfWeek > 7)) {
    errors.days = 'Incluí los siete días de lunes a domingo, sin repetir.'
  }
  const validTime = (value: string | null) => Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  days.forEach((day, index) => {
    const key = `days[${index}]`
    if (!day.isWorkingDay) {
      for (const field of ['from', 'until', 'openingCutoff'] as const) {
        if (day[field]) errors[`${key}.${field}`] = 'Un día no laborable no lleva horas.'
      }
      return
    }
    for (const field of ['from', 'until'] as const) {
      if (!validTime(day[field])) errors[`${key}.${field}`] = 'Ingresá una hora válida (HH:mm).'
    }
    if (validTime(day.from) && validTime(day.until) && day.from! >= day.until!) errors[`${key}.until`] = 'La hora hasta debe ser posterior a la hora desde. No puede cruzar medianoche.'
    if (day.openingCutoff && (!validTime(day.openingCutoff) || (validTime(day.from) && day.openingCutoff < day.from!) || (validTime(day.until) && day.openingCutoff > day.until!))) {
      errors[`${key}.openingCutoff`] = 'El límite debe estar entre la hora desde y la hora hasta.'
    }
  })
  return errors
}
export function workingHoursBody(days: WorkingDay[]) {
  return { days: days.map((day) => ({ ...day,
    from: day.isWorkingDay && day.from ? `${day.from}:00` : null,
    until: day.isWorkingDay && day.until ? `${day.until}:00` : null,
    openingCutoff: day.isWorkingDay && day.openingCutoff ? `${day.openingCutoff}:00` : null })) }
}
// ASP.NET/FluentValidation puede usar Days[0].From o $.days[0].from.
export function normalizeFieldErrors(errors: Record<string, string[]> = {}) {
  return Object.fromEntries(Object.entries(errors).map(([key, values]) => [key.replace(/^\$\./, '').toLowerCase(), values.join(' ')]))
}

import { BUSINESS_TIME_ZONE } from '../core'
import type { WorkingDay } from '../workingHours'

const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-AR', { timeZone: BUSINESS_TIME_ZONE, ...options })
const hm = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const hms = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
const day = fmt({ weekday: 'short', day: '2-digit', month: '2-digit' })

export const time = (iso: string) => hm.format(new Date(iso))
export const timeWithSeconds = (iso: string) => hms.format(new Date(iso))
export const shortDay = (iso: string) => day.format(new Date(iso))
const dateKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' })

/** La hora; con el día adelante si no es el mismo día que `reference`. */
export function stamp(iso: string, reference: string): string {
  const same = dateKey.format(new Date(iso)) === dateKey.format(new Date(reference))
  return same ? time(iso) : `${shortDay(iso)} ${time(iso)}`
}

/** 45 s · 3 min · 1 h 5 min */
export function duration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s} s`
  const minutes = Math.round(s / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60), m = minutes % 60
  if (h >= 24) { const d = Math.floor(h / 24), rest = h % 24; return rest ? `${d} d ${rest} h` : `${d} d` }
  return m ? `${h} h ${m} min` : `${h} h`
}

export const between = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 1000

const hhmm = (value: string | null) => value?.slice(0, 5) ?? ''
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Agrupa los días seguidos con el mismo horario: «Lun–Vie 07:00–18:00 · abrir hasta 10:00». */
export function workingHoursSummary(days: WorkingDay[]): string[] {
  const sorted = [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  const key = (d: WorkingDay) => d.isWorkingDay ? `${hhmm(d.from)}–${hhmm(d.until)}${d.openingCutoff ? ` · abrir hasta ${hhmm(d.openingCutoff)}` : ''}` : 'No se trabaja'
  const groups: { first: number; last: number; text: string }[] = []
  for (const d of sorted) {
    const text = key(d)
    const previous = groups.at(-1)
    if (previous && previous.text === text && previous.last === d.dayOfWeek - 1) previous.last = d.dayOfWeek
    else groups.push({ first: d.dayOfWeek, last: d.dayOfWeek, text })
  }
  return groups.map((g) => `${DAYS[g.first - 1]}${g.last !== g.first ? `–${DAYS[g.last - 1]}` : ''} ${g.text}`)
}

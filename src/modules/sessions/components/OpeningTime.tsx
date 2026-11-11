import { BUSINESS_TIME_ZONE } from '../../core'

const hora = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
const dia = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: BUSINESS_TIME_ZONE, weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(iso))

/** La hora en que el chofer abrió la salida. Dato clave: siempre en rojo, que no pase desapercibido. */
export function OpeningTime({ openedAt, size = 'lg' }: { openedAt: string; size?: 'lg' | 'sm' }) {
  return <span className={`inline-flex items-baseline gap-2 rounded border-2 border-danger bg-danger-soft font-semibold text-danger ${size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5 text-sm'}`}
    title="Hora de apertura de la salida">
    <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>Abrió</span>
    <span className={`tabular-nums ${size === 'lg' ? 'text-2xl' : 'text-base'}`}>{hora(openedAt)}</span>
    <span className={`font-medium ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{dia(openedAt)}</span>
  </span>
}

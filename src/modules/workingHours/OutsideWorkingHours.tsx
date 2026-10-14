import { Badge, BUSINESS_TIME_ZONE, formatDateTime } from '../core'
import type { OutsideWorkingHoursEvent, WorkingHoursOperation } from './types'

export function OutsideWorkingHoursBadge({ marked }: { marked?: boolean }) {
  return marked ? <Badge tone="warning">Fuera de horario</Badge> : null
}
const operationNames: Record<WorkingHoursOperation, string> = {
  'initial-load': 'Carga inicial', 'session-open': 'Apertura de salida', restock: 'Recarga', visit: 'Visita',
  promotion: 'Registro de promoción', 'promotion-close': 'Cierre de promoción', 'session-close': 'Recepción del camión', settlement: 'Rendición de efectivo',
}
export function OutsideWorkingHoursEvents({ events = [] }: { events?: OutsideWorkingHoursEvent[] }) {
  if (!events.length) return null
  return <div className="rounded border border-warning/40 bg-warning-soft p-3">
    <OutsideWorkingHoursBadge marked />
    <p className="mt-2 text-sm">Operaciones registradas fuera del horario laboral (hora de Argentina):</p>
    <ul className="mt-1 space-y-1 text-sm">{events.map((event) => <li key={`${event.operation}:${event.id}`}>
      {operationNames[event.operation] ?? event.operation} · {formatDateTime(event.occurredAt, BUSINESS_TIME_ZONE)}
    </li>)}</ul>
  </div>
}

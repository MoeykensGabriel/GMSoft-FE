import type { DriverControlMark, DriverControlSession } from './service'
import { stamp, time, timeWithSeconds } from './format'

function markTone(m: DriverControlMark) {
  if (m.inBurst) return 'bg-danger'
  if (m.doubtful) return 'bg-muted'
  if (m.offline) return 'bg-warning'
  return 'bg-success'
}

/**
 * El día de la salida en una línea: la apertura en rojo y un punto por visita, en la hora
 * en que se marcó. Puntos amontonados en rojo son visitas cargadas en bloque.
 */
export function SessionTimeline({ session }: { session: DriverControlSession }) {
  const points = [session.openedAt, session.loadedAt, session.closedAt, ...session.marks.map((m) => m.at)]
    .filter((x): x is string => Boolean(x)).map((x) => Date.parse(x))
  const start = Math.min(...points), end = Math.max(...points)
  const span = Math.max(end - start, 60_000)
  const left = (iso: string) => `${((Date.parse(iso) - start) / span) * 100}%`
  const endLabel = session.closedAt ?? session.lastVisitAt

  return <div className="flex flex-col gap-1" aria-hidden="true">
    <div className="relative h-8 rounded bg-canvas">
      {session.loadedAt && <span className="absolute inset-y-1 w-0.5 bg-accent" style={{ left: left(session.loadedAt) }} title={`Carga de la oficina ${time(session.loadedAt)}`} />}
      <span className="absolute inset-y-0 w-1 -translate-x-1/2 rounded bg-danger" style={{ left: left(session.openedAt) }} title={`Abrió ${time(session.openedAt)}`} />
      {session.closedAt && <span className="absolute inset-y-1 w-0.5 bg-ink" style={{ left: left(session.closedAt) }} title={`Volvió ${time(session.closedAt)}`} />}
      {session.marks.map((m, i) => <span key={i}
        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-surface ${markTone(m)}`}
        style={{ left: left(m.at) }} title={`${timeWithSeconds(m.at)} · ${m.customerName}`} />)}
    </div>
    <div className="flex justify-between text-xs text-muted tabular-nums">
      <span>{stamp(new Date(start).toISOString(), session.openedAt)}</span>
      {endLabel && <span>{stamp(new Date(end).toISOString(), session.openedAt)}</span>}
    </div>
  </div>
}

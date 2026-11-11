import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ApiError, Button, currentBusinessDate, Field, Page, PageHeader, Panel } from '../core'
import { OpeningTime } from '../sessions'
import { workingHoursQuery } from '../workingHours'
import { periodRange, rangeError } from '../reports'
import { driverControlService } from './service'
import type { DriverControlDriver, DriverControlReport, DriverControlSession } from './service'
import { between, duration, shortDay, stamp, workingHoursSummary } from './format'
import { SessionTimeline } from './SessionTimeline'

type Period = 'today' | 'week' | 'month' | 'previousMonth' | 'custom'
const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' }, { value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mes' },
  { value: 'previousMonth', label: 'Mes anterior' }, { value: 'custom', label: 'Personalizado' },
]
const DAY = 86_400_000

function rangeOf(period: Exclude<Period, 'custom'>) {
  const today = currentBusinessDate()
  return period === 'today' ? { from: today, to: today } : periodRange(period, today)
}

type Tone = 'danger' | 'warning' | 'success' | 'neutral'
const chipTones: Record<Tone, string> = {
  danger: 'border-danger/40 bg-danger-soft text-danger-dark',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  success: 'border-success/40 bg-success-soft text-success-dark',
  neutral: 'border-line bg-canvas text-ink',
}

function Chip({ tone, label, children }: { tone: Tone; label: string; children: ReactNode }) {
  return <div className={`flex min-w-0 flex-col rounded border px-3 py-2 ${chipTones[tone]}`}>
    <span className="text-xs font-medium opacity-80">{label}</span>
    <span className="text-lg font-semibold tabular-nums">{children}</span>
  </div>
}

const Dot = ({ className }: { className: string }) => <span aria-hidden="true" className={`inline-block h-3 w-3 shrink-0 rounded-full ${className}`} />

function driverTone(d: DriverControlDriver): Tone {
  if (d.bursts > 0 || d.doubtfulVisits > 0) return 'danger'
  if (d.offlineVisits > 0 || d.outsideHoursOpenings > 0 || d.outsideHoursVisits > 0) return 'warning'
  return 'success'
}
const borderTone: Record<Tone, string> = { danger: 'border-l-danger', warning: 'border-l-warning', success: 'border-l-success', neutral: 'border-l-line' }

function Rules({ report }: { report: DriverControlReport }) {
  const hours = useQuery(workingHoursQuery)
  const lines = hours.data?.isConfigured ? workingHoursSummary(hours.data.days) : null
  return <Panel title="Cómo se controla">
    <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <li className="flex items-start gap-2"><span aria-hidden="true" className="mt-0.5 h-4 w-1 shrink-0 rounded bg-danger" />
        <span><b>Apertura</b>: hora en que el chofer abrió la salida en el celular.</span></li>
      <li className="flex items-start gap-2"><Dot className="mt-1 bg-danger" />
        <span><b>Ráfaga</b>: {report.burstMinVisits} o más visitas marcadas a menos de {report.burstGapSeconds} s una de otra.</span></li>
      <li className="flex items-start gap-2"><Dot className="mt-1 bg-warning" />
        <span><b>Sin señal</b>: llegó al sistema {report.offlineDelayMinutes} min o más después de marcarse.</span></li>
      <li className="flex items-start gap-2"><Dot className="mt-1 bg-muted" />
        <span><b>Hora dudosa</b>: el reloj del celular no coincide.</span></li>
    </ul>
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold">Horario laboral:</span>
      {lines ? lines.map((line) => <span key={line} className="rounded border border-line bg-canvas px-2 py-0.5">{line}</span>)
        : <span className="text-muted">{hours.isLoading ? 'Cargando…' : 'Sin configurar'}</span>}
      <Link to="/panel/configuracion/horario-laboral" className="ui-link">Cambiar</Link>
    </div>
  </Panel>
}

function SessionRow({ s }: { s: DriverControlSession }) {
  const waited = s.loadedAt ? between(s.loadedAt, s.openedAt) : null
  return <li className="flex min-w-0 flex-col gap-2 rounded border border-line bg-surface p-3">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="font-semibold capitalize">{shortDay(s.openedAt)}</span>
      <OpeningTime openedAt={s.openedAt} size="sm" />
      {s.openedOutsideWorkingHours && <span className="rounded border border-warning/40 bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">Fuera de horario</span>}
      <span className="text-sm text-muted">{s.vehicleName} · {s.zoneName}</span>
      <Link to={`/panel/salidas/${s.sessionId}`} className="ui-link ml-auto text-sm">Ver salida</Link>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
      {s.loadedAt && <span>Carga oficina {stamp(s.loadedAt, s.openedAt)}{waited !== null && waited > 0 && <span className="text-muted"> · abrió {duration(waited)} después</span>}</span>}
      {s.firstVisitAt ? <span>1ª visita {stamp(s.firstVisitAt, s.openedAt)}</span> : <span className="text-muted">Sin visitas</span>}
      {s.lastVisitAt && <span>Última {stamp(s.lastVisitAt, s.openedAt)}</span>}
      {s.closedAt ? <span>Volvió {stamp(s.closedAt, s.openedAt)}</span> : <span className="font-semibold text-warning">En la calle</span>}
    </div>
    <SessionTimeline session={s} />
    <div className="flex flex-wrap gap-2 text-sm">
      <span className="rounded bg-canvas px-2 py-0.5">{s.visits} visitas</span>
      {s.medianIntervalSeconds !== null && <span className="rounded bg-canvas px-2 py-0.5">Entre visitas: {duration(s.medianIntervalSeconds)}</span>}
      {s.bursts.map((b) => <span key={b.start} className="rounded border border-danger/40 bg-danger-soft px-2 py-0.5 font-semibold text-danger-dark">
        {b.count} visitas en {duration(between(b.start, b.end))} · {stamp(b.start, s.openedAt)}</span>)}
      {s.offlineVisits > 0 && <span className="rounded border border-warning/40 bg-warning-soft px-2 py-0.5 text-warning">{s.offlineVisits} sin señal</span>}
      {s.doubtfulVisits > 0 && <span className="rounded border border-line bg-canvas px-2 py-0.5 text-muted">{s.doubtfulVisits} hora dudosa</span>}
      {s.noPurchase > 0 && <span className="rounded bg-canvas px-2 py-0.5">No compró {s.noPurchase} ({s.didNotWant} «no quiso»)</span>}
    </div>
  </li>
}

function DriverCard({ d }: { d: DriverControlDriver }) {
  const tone = driverTone(d)
  return <details className={`ui-card min-w-0 border-l-4 ${borderTone[tone]}`}>
    <summary className="flex cursor-pointer list-none flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{d.driverName}</h2>
        <span className="text-sm text-muted">{d.sessionCount} {d.sessionCount === 1 ? 'salida' : 'salidas'} · {d.visits} visitas · ver detalle ▾</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Chip tone="danger" label="Abre normalmente">{d.usualOpening?.slice(0, 5) ?? '—'}</Chip>
        <Chip tone={d.bursts > 0 ? 'danger' : 'success'} label="Ráfagas">{d.bursts}{d.bursts > 0 && <span className="text-sm font-medium"> · {d.burstVisits} visitas</span>}</Chip>
        <Chip tone={d.offlineVisits > 0 ? 'warning' : 'success'} label="Sin señal">{d.offlineVisits}</Chip>
        <Chip tone={d.outsideHoursOpenings + d.outsideHoursVisits > 0 ? 'warning' : 'success'} label="Fuera de horario">{d.outsideHoursOpenings + d.outsideHoursVisits}</Chip>
        <Chip tone="neutral" label="Entre visitas">{d.medianIntervalSeconds === null ? '—' : duration(d.medianIntervalSeconds)}</Chip>
        <Chip tone={d.noPurchase > 0 && d.didNotWant / d.noPurchase >= 0.7 ? 'warning' : 'neutral'} label="«No quiso»">
          {d.didNotWant}<span className="text-sm font-medium"> de {d.noPurchase} sin compra</span></Chip>
      </div>
      {d.doubtfulVisits > 0 && <p className="text-sm font-semibold text-danger">{d.doubtfulVisits} visitas con la hora del celular dudosa</p>}
    </summary>
    <ol className="flex flex-col gap-3 border-t border-line p-4">
      {[...d.sessions].reverse().map((s) => <SessionRow key={s.sessionId} s={s} />)}
    </ol>
  </details>
}

export function DriverControlView() {
  const [period, setPeriod] = useState<Period>('week')
  const [custom, setCustom] = useState(() => rangeOf('week'))
  const range = period === 'custom' ? custom : rangeOf(period)
  const tooLong = (Date.parse(range.to) - Date.parse(range.from)) / DAY + 1 > 62
  const validation = rangeError(range) ?? (tooLong ? 'El período no puede superar los 62 días.' : null)
  const report = useQuery({
    queryKey: ['reports', 'driver-control', range.from, range.to],
    queryFn: () => driverControlService.get(range.from, range.to),
    enabled: !validation,
  })
  const errorText = report.error instanceof ApiError
    ? report.error.fieldMessages.join(' ') || report.error.message
    : 'No se pudo cargar el control. Revisá la conexión y volvé a intentar.'

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Control de choferes" />
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar período">
        {periods.map((item) => <Button key={item.value} variant={period === item.value ? 'navigation' : 'secondary'} aria-pressed={period === item.value}
          onClick={() => { if (item.value === 'custom') setCustom(range); setPeriod(item.value) }}>{item.label}</Button>)}
      </div>
      {period === 'custom' && <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Desde" type="date" min="0001-01-02" max="9999-12-30" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} />
        <Field label="Hasta" type="date" min="0001-01-02" max="9999-12-30" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} />
      </div>}
      {validation && <p role="alert" className="text-sm text-warning">{validation}</p>}
    </div>
    {report.data && <Rules report={report.data} />}
    {!validation && report.isLoading && <Panel><p role="status">Cargando…</p></Panel>}
    {!validation && report.isError && <Panel><p role="alert" className="text-warning">{errorText}</p>
      <Button variant="secondary" disabled={report.isFetching} onClick={() => void report.refetch()}>Reintentar</Button></Panel>}
    {report.data && (report.data.drivers.length === 0
      ? <Panel><p role="status">No hubo salidas en este período.</p></Panel>
      : <div className="flex flex-col gap-3">{report.data.drivers.map((d) => <DriverCard key={d.driverId} d={d} />)}</div>)}
  </Page>
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError, Button, currentBusinessDate, Field, Page, PageHeader, Panel } from '../core'
import { accessControlService } from './service'
import type { AccessDriver } from './service'
import { clientLabel, describeAccess } from './accessFormat'
import type { AccessTone } from './accessFormat'
import { time } from './format'

const dots: Record<AccessTone, string> = {
  success: 'bg-success', navigation: 'bg-brand', neutral: 'bg-muted', warning: 'bg-amber-500', danger: 'bg-danger',
}
const chips: Record<AccessTone, string> = {
  success: 'border-success/40 bg-success-soft text-success-dark',
  navigation: 'border-brand/30 bg-accent-soft text-brand-dark',
  neutral: 'border-line bg-canvas text-ink',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  danger: 'border-danger/40 bg-danger-soft text-danger-dark',
}

const Dot = ({ tone }: { tone: AccessTone }) => <span aria-hidden="true" className={`mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full ${dots[tone]}`} />
const Chip = ({ tone, children }: { tone: AccessTone; children: string }) =>
  <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${chips[tone]}`}>{children}</span>

function shiftDay(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function Rules() {
  return <Panel title="Cómo leerlo">
    <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <li className="flex items-start gap-2"><Dot tone="danger" /><span><b>Se cerró sola</b>: el celular borró los datos. Pasa con limpiadores, ahorro de batería o incógnito.</span></li>
      <li className="flex items-start gap-2"><Dot tone="warning" /><span><b>Dentro de otra app</b>: la abrió desde un enlace de WhatsApp o Facebook. Tiene que usar el ícono instalado.</span></li>
      <li className="flex items-start gap-2"><Dot tone="warning" /><span><b>Venció</b>: estuvo más de 12 horas sin una salida abierta.</span></li>
      <li className="flex items-start gap-2"><Dot tone="navigation" /><span><b>Recepción</b>: la oficina recibió el camión y la app volvió al login.</span></li>
    </ul>
  </Panel>
}

function DriverCard({ d }: { d: AccessDriver }) {
  const tone: AccessTone = d.problems > 0 ? 'danger' : 'success'
  return <section className={`ui-card border-l-4 ${tone === 'danger' ? 'border-l-danger' : 'border-l-success'}`}
    aria-label={`Sesiones de ${d.driverName}`}>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
      <h2 className="text-lg font-semibold">{d.driverName}</h2>
      <div className="flex flex-wrap gap-2">
        <Chip tone="neutral">{`Entradas: ${d.logins}`}</Chip>
        <Chip tone={tone}>{d.problems > 0 ? `Se salió solo: ${d.problems}` : 'Sin problemas'}</Chip>
      </div>
    </header>
    <ol className="flex flex-col">
      {d.events.map((e, index) => {
        const what = describeAccess(e)
        const client = e.kind === 'Login' ? clientLabel(e.client) : null
        return <li key={index} className="flex items-start gap-3 border-b border-line px-4 py-2 last:border-b-0">
          <span className="w-12 shrink-0 font-semibold tabular-nums">{time(e.occurredAt)}</span>
          <Dot tone={what.tone} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{what.label}</span>
              {client && <Chip tone={client.tone}>{client.label}</Chip>}
              {e.device && <span className="text-sm text-muted">{e.device}</span>}
            </div>
            {what.note && <p className="text-sm">{what.note}</p>}
          </div>
        </li>
      })}
    </ol>
  </section>
}

export function AccessControlView() {
  const today = currentBusinessDate()
  const [day, setDay] = useState(today)
  const report = useQuery({
    queryKey: ['reports', 'access-control', day],
    queryFn: () => accessControlService.get(day),
    enabled: Boolean(day),
    refetchInterval: day === today ? 60_000 : false,
  })
  const errorText = report.error instanceof ApiError
    ? report.error.fieldMessages.join(' ') || report.error.message
    : 'No se pudo cargar el control. Revisá la conexión y volvé a intentar.'

  return <Page className="mx-auto flex max-w-5xl flex-col gap-5 p-6">
    <PageHeader title="Control de sesiones" />
    <div className="flex flex-wrap items-end gap-2">
      <Button variant={day === today ? 'navigation' : 'secondary'} aria-pressed={day === today} onClick={() => setDay(today)}>Hoy</Button>
      <Button variant="secondary" aria-label="Día anterior" onClick={() => setDay(shiftDay(day || today, -1))}>‹</Button>
      <Field label="Día" type="date" min="0001-01-02" max={today} value={day} onChange={(event) => setDay(event.target.value)} />
      <Button variant="secondary" aria-label="Día siguiente" disabled={!day || day >= today} onClick={() => setDay(shiftDay(day, 1))}>›</Button>
    </div>
    <Rules />
    {report.isLoading && <Panel><p role="status">Cargando…</p></Panel>}
    {report.isError && <Panel><p role="alert" className="text-warning">{errorText}</p>
      <Button variant="secondary" disabled={report.isFetching} onClick={() => void report.refetch()}>Reintentar</Button></Panel>}
    {report.data && (report.data.drivers.length === 0
      ? <Panel><p role="status">Ningún chofer entró a la app este día.</p></Panel>
      : <div className="flex flex-col gap-3">{report.data.drivers.map((d) => <DriverCard key={d.driverId} d={d} />)}</div>)}
  </Page>
}

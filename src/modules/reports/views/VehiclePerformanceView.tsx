import { useState } from 'react'
import { ApiError, Button, currentBusinessDate, Field, formatMoney, Page, PageHeader, Panel, StatTile } from '../../core'
import { useVehiclePerformance } from '../hooks/useVehiclePerformance'
import { periodRange, rangeError } from '../utils/period'
import type { Period } from '../utils/period'
import { formatPercent } from '../utils/format'
import { VehiclePerformanceChart } from '../components/VehiclePerformanceChart'
import { VehiclePerformanceTable } from '../components/VehiclePerformanceTable'

const periods: { value: Period; label: string }[] = [
  { value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mes' },
  { value: 'previousMonth', label: 'Mes anterior' }, { value: 'custom', label: 'Personalizado' },
]

export function VehiclePerformanceView() {
  const [period, setPeriod] = useState<Period>('month')
  const [custom, setCustom] = useState(() => periodRange('month', currentBusinessDate()))
  const range = period === 'custom' ? custom : periodRange(period, currentBusinessDate())
  const validation = rangeError(range)
  const report = useVehiclePerformance(range.from, range.to)
  const vehicles = report.data?.vehicles ?? []
  const totals = vehicles.reduce((sum, vehicle) => ({
    sold: sum.sold + vehicle.sold, collected: sum.collected + vehicle.collected,
    onAccount: sum.onAccount + vehicle.onAccount, kilometers: sum.kilometers + vehicle.kilometers,
    sessions: sum.sessions + vehicle.sessions,
  }), { sold: 0, collected: 0, onAccount: 0, kilometers: 0, sessions: 0 })
  const errorText = report.error instanceof ApiError
    ? report.error.fieldMessages.join(' ') || report.error.message
    : 'No se pudo cargar el reporte. Revisá la conexión y volvé a intentar.'

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Rendimiento por camión" description="Compará ventas, cobros y actividad de las salidas del período." />
    <Panel title="Período">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar período">
        {periods.map((item) => <Button key={item.value} variant={period === item.value ? 'navigation' : 'secondary'} aria-pressed={period === item.value}
          onClick={() => { if (item.value === 'custom') setCustom(range); setPeriod(item.value) }}>{item.label}</Button>)}
      </div>
      {period === 'custom' ? <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Desde" type="date" min="0001-01-02" max="9999-12-30" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} />
        <Field label="Hasta" type="date" min="0001-01-02" max="9999-12-30" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} />
      </div> : <p className="text-sm text-muted">Del {range.from.split('-').reverse().join('/')} al {range.to.split('-').reverse().join('/')} · Hora argentina</p>}
      {validation && <p role="alert" className="text-sm text-warning">{validation}</p>}
      <p className="text-xs text-muted">Se toma la fecha de apertura de cada salida, incluidas las abiertas, y toda su actividad asociada.</p>
    </Panel>
    {!validation && <>
      {report.isLoading && <Panel><p role="status">Cargando rendimiento por camión…</p></Panel>}
      {report.isError && <Panel><p role="alert" className="text-warning">{errorText}</p>
        {report.data && <p className="text-sm text-muted">Se muestran los últimos datos recibidos para este período.</p>}
        <Button variant="secondary" disabled={report.isFetching} onClick={() => void report.refetch()}>Reintentar</Button>
      </Panel>}
      {report.data && <>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Vendido total" value={formatMoney(totals.sold)} />
          <StatTile label="Cobrado total" value={formatMoney(totals.collected)} detail={`${formatPercent(totals.sold === 0 ? null : totals.collected / totals.sold)} cobrado`} tone="info" />
          <StatTile label="Quedó a cuenta total" value={formatMoney(totals.onAccount)} tone="warning" />
          <StatTile label="Kilómetros totales" value={`${totals.kilometers.toLocaleString('es-AR')} km`} />
        </div>
        {totals.sessions === 0 ? <Panel><p role="status">No hubo salidas en este período</p></Panel> : <Panel title="Ventas y cobros por camión">
          <VehiclePerformanceChart vehicles={vehicles} />
          <p className="text-xs text-muted">Cobrado incluye cobros de deuda. Quedó a cuenta es vendido menos cobrado y puede ser negativo.</p>
        </Panel>}
        {vehicles.length > 0 && <section className="flex min-w-0 flex-col gap-3" aria-labelledby="comparison-title">
          <h2 id="comparison-title" className="font-semibold">Comparativa por camión</h2>
          <VehiclePerformanceTable vehicles={vehicles} />
          <p className="text-xs text-muted">Recorrido: clientes asignados hoy. Faltantes: solo salidas cerradas; valores negativos indican sobrantes. Caja: solo rendiciones registradas; cero no significa que todas estén rendidas. Km: salidas cerradas con kilometraje; $ por km incluye todas las ventas del período.</p>
        </section>}
      </>}
    </>}
  </Page>
}

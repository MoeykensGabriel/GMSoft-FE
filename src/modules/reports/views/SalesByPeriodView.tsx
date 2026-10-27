import { useState } from 'react'
import { Button, currentBusinessDate, DataTable, ErrorMessage, formatMoney, Page, PageHeader } from '../../core'
import { useVehiclePerformance } from '../hooks/useVehiclePerformance'
import { isCurrentPeriod, periodFor, periodTitle, shiftPeriod } from '../utils/salesPeriod'
import type { SalesPeriodKind } from '../utils/salesPeriod'

export function SalesByPeriodView() {
  const today = currentBusinessDate()
  const [kind, setKind] = useState<SalesPeriodKind>('week')
  const [selectedRange, setSelectedRange] = useState<ReturnType<typeof periodFor> | null>(null)
  const range = selectedRange ?? periodFor(kind, today)
  const current = isCurrentPeriod(kind, range, today)
  const report = useVehiclePerformance(range.from, range.to)
  const vehicles = report.data?.vehicles ?? []
  const total = vehicles.reduce((sum, vehicle) => sum + vehicle.sold, 0)

  const move = (delta: -1 | 1) => {
    if (delta === 1 && current) return
    const next = shiftPeriod(kind, range, delta)
    setSelectedRange(isCurrentPeriod(kind, next, today) ? null : next)
  }

  return <Page className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-5 p-4 sm:p-6">
    <PageHeader title="Ventas" />
    <div className="flex gap-2" role="group" aria-label="Seleccionar período">
      {(['week', 'month'] as const).map((value) => <Button key={value}
        variant={kind === value ? 'navigation' : 'secondary'} aria-pressed={kind === value} className="min-h-11"
        onClick={() => { setKind(value); setSelectedRange(null) }}>
        {value === 'week' ? 'Semana' : 'Mes'}
      </Button>)}
    </div>
    <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
      <Button variant="secondary" className="min-h-11 min-w-11 text-xl" aria-label="Período anterior" onClick={() => move(-1)}>‹</Button>
      <h2 className="text-center text-sm font-semibold sm:text-base" aria-live="polite">{periodTitle(kind, range)}</h2>
      <Button variant="secondary" className="min-h-11 min-w-11 text-xl" aria-label="Período siguiente" disabled={current} onClick={() => move(1)}>›</Button>
    </div>
    {report.isLoading && <p role="status">Cargando…</p>}
    {report.isError && <div className="flex flex-col items-start gap-3">
      <ErrorMessage error={report.error} fallback="No se pudieron cargar las ventas." />
      <Button variant="secondary" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}>Reintentar</Button>
    </div>}
    {report.data && !report.isError && <DataTable label="Ventas por camión" stack={false} className="table-fixed">
      <thead><tr>
        <th scope="col">Camión</th>
        <th scope="col" className="text-right">Vendido</th>
      </tr></thead>
      <tbody>{vehicles.map((vehicle) => <tr key={vehicle.vehicleId}>
        <th scope="row" className="font-normal">{vehicle.vehicleName} · {vehicle.licensePlate || '—'}</th>
        <td className={`text-right tabular-nums ${vehicle.sold === 0 ? 'text-muted' : ''}`}>{formatMoney(vehicle.sold)}</td>
      </tr>)}</tbody>
      <tfoot className="border-t-2 border-accent bg-accent-soft font-bold text-brand-dark"><tr>
        <th scope="row">Total</th>
        <td className="text-right tabular-nums">{formatMoney(total)}</td>
      </tr></tfoot>
    </DataTable>}
  </Page>
}

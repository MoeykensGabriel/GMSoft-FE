import { useState } from 'react'
import { Button, currentBusinessDate, DataTable, ErrorMessage, Field, formatMoney, Page, PageHeader, Panel } from '../../core'
import { useVehiclePerformance } from '../hooks/useVehiclePerformance'
import { rangeError } from '../utils/period'
import { isCurrentPeriod, parsePercent, percentAmount, periodFor, rangeTitle, shiftPeriod } from '../utils/salesPeriod'
import type { SalesPeriodKind, SalesPeriodRange } from '../utils/salesPeriod'

const PERCENT_KEY = 'gmsoft.ventas.porcentaje'
const COMMISSION_KEY = 'gmsoft.ventas.comision-choferes'

function readStored(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

/** Porcentaje que se recuerda por navegador. */
function useStoredPercent(key: string, fallback: string) {
  const [text, setText] = useState(() => readStored(key, fallback))
  const change = (value: string) => {
    setText(value)
    try { localStorage.setItem(key, value) } catch { /* sin almacenamiento: queda solo en pantalla */ }
  }
  return [text, change, parsePercent(text)] as const
}

function PercentField({ label, text, percent, onChange }: { label: string; text: string; percent: number | null; onChange: (value: string) => void }) {
  return <Field label={label} inputMode="decimal" autoComplete="off" value={text}
    error={text.trim() && percent === null ? 'Entre 0 y 100' : undefined}
    onChange={(event) => onChange(event.target.value)} />
}

export function SalesByPeriodView() {
  const today = currentBusinessDate()
  const [kind, setKind] = useState<SalesPeriodKind>('week')
  const [selectedRange, setSelectedRange] = useState<SalesPeriodRange | null>(null)
  const [percentText, changePercent, percent] = useStoredPercent(PERCENT_KEY, '1')
  const [commissionText, changeCommission, commission] = useStoredPercent(COMMISSION_KEY, '')
  const range = selectedRange ?? periodFor(kind, today)
  const validation = rangeError(range)
  const current = isCurrentPeriod(kind, range, today)
  const report = useVehiclePerformance(range.from, range.to)
  const vehicles = report.data?.vehicles ?? []
  const total = vehicles.reduce((sum, vehicle) => sum + vehicle.sold, 0)
  const drivers = report.data?.drivers ?? []
  const driversSold = drivers.reduce((sum, driver) => sum + driver.sold, 0)
  const commissionOf = (sold: number) => commission === null ? '—' : formatMoney(percentAmount(sold, commission))
  const showReport = !validation && report.data && !report.isError

  const move = (delta: -1 | 1) => {
    if (delta === 1 && current) return
    const next = shiftPeriod(kind, range, delta)
    setSelectedRange(isCurrentPeriod(kind, next, today) ? null : next)
  }
  const changeDate = (field: keyof SalesPeriodRange, value: string) => {
    const next = { ...range, [field]: value }
    setSelectedRange(isCurrentPeriod(kind, next, today) ? null : next)
  }

  return <Page className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-5 p-4 sm:p-6">
    <PageHeader title="Ventas" />
    <Panel aria-label="Filtros">
      <div className="flex gap-2" role="group" aria-label="Seleccionar período">
        {(['week', 'month'] as const).map((value) => <Button key={value}
          variant={kind === value ? 'navigation' : 'secondary'} aria-pressed={kind === value} className="min-h-11"
          onClick={() => { setKind(value); setSelectedRange(null) }}>
          {value === 'week' ? 'Semana' : 'Mes'}
        </Button>)}
      </div>
      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
        <Button variant="secondary" className="min-h-11 min-w-11 text-xl" aria-label="Período anterior" disabled={!!validation} onClick={() => move(-1)}>‹</Button>
        <h2 className="text-center text-sm font-semibold sm:text-base" aria-live="polite">{validation ? '—' : rangeTitle(kind, range)}</h2>
        <Button variant="secondary" className="min-h-11 min-w-11 text-xl" aria-label="Período siguiente" disabled={current || !!validation} onClick={() => move(1)}>›</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde" type="date" min="0001-01-02" max="9999-12-30" required value={range.from} onChange={(event) => changeDate('from', event.target.value)} />
        <Field label="Hasta" type="date" min="0001-01-02" max="9999-12-30" required value={range.to} onChange={(event) => changeDate('to', event.target.value)} />
      </div>
      {validation && <p role="alert" className="text-sm text-warning">{validation}</p>}
    </Panel>
    <Panel aria-label="Porcentaje sobre el total">
      <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-end gap-3">
        <PercentField label="Porcentaje %" text={percentText} percent={percent} onChange={changePercent} />
        <p className="min-h-11 rounded-lg bg-accent-soft px-3 py-2 text-right text-xl font-bold tabular-nums text-brand-dark" aria-live="polite">
          {showReport && percent !== null ? formatMoney(percentAmount(total, percent)) : '—'}
        </p>
      </div>
    </Panel>
    {!validation && report.isLoading && <p role="status">Cargando…</p>}
    {!validation && report.isError && <div className="flex flex-col items-start gap-3">
      <ErrorMessage error={report.error} fallback="No se pudieron cargar las ventas." />
      <Button variant="secondary" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}>Reintentar</Button>
    </div>}
    {showReport && <DataTable label="Ventas por camión" stack={false} className="table-fixed">
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
    {showReport && <Panel title="Comisión de choferes">
      <div className="max-w-[7rem]"><PercentField label="Comisión %" text={commissionText} percent={commission} onChange={changeCommission} /></div>
      <DataTable label="Comisión por chofer" stack={false} className="table-fixed">
        <thead><tr>
          <th scope="col">Chofer</th>
          <th scope="col" className="text-right">Vendido</th>
          <th scope="col" className="text-right">Comisión</th>
        </tr></thead>
        <tbody>{drivers.length === 0
          ? <tr><td colSpan={3} className="text-muted">Sin salidas en el período</td></tr>
          : drivers.map((driver) => <tr key={driver.driverId}>
            <th scope="row" className="font-normal">{driver.driverName}</th>
            <td className={`text-right tabular-nums ${driver.sold === 0 ? 'text-muted' : ''}`}>{formatMoney(driver.sold)}</td>
            <td className="text-right font-semibold tabular-nums text-success">{commissionOf(driver.sold)}</td>
          </tr>)}</tbody>
        <tfoot className="border-t-2 border-accent bg-accent-soft font-bold text-brand-dark"><tr>
          <th scope="row">Total</th>
          <td className="text-right tabular-nums">{formatMoney(driversSold)}</td>
          <td className="text-right tabular-nums">{commissionOf(driversSold)}</td>
        </tr></tfoot>
      </DataTable>
    </Panel>}
  </Page>
}

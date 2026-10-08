import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, ErrorMessage, Field, Page, PageHeader, Select } from '../../core'
import { vehicleService } from '../../vehicles'
import { dailySummaryQuery } from '../hooks/dailySummaryQuery'
import { SessionDailySummaryCard } from '../components/SessionDailySummaryCard'
import { DailySummaryMoneyTable, DailySummaryStockTable } from '../components/DailySummaryTables'
import { summaryDateLabel, summaryToday } from '../utils/dailySummary'

export function DailySummaryView() {
  const [vehicleId, setVehicleId] = useState('')
  const [date, setDate] = useState(summaryToday)
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const summary = useQuery(dailySummaryQuery(vehicleId, date))
  const data = summary.data

  return <Page className="mx-auto flex min-w-0 max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Resumen diario" description="Cuadre del camión y del efectivo. Se actualiza cada 30 segundos y al volver a esta ventana." />
    <div className="grid gap-3 sm:grid-cols-2">
      <Select label="Vehículo" name="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={vehicles.isLoading}>
        <option value="">Elegí un vehículo</option>
        {vehicles.data?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.licensePlate})</option>)}
      </Select>
      <Field label="Fecha" name="date" type="date" value={date} min="0001-01-02" max="9999-12-30" onChange={(e) => setDate(e.target.value)} />
    </div>
    {vehicles.isLoading && <p role="status" className="text-sm text-muted">Cargando vehículos...</p>}
    {vehicles.isError && <div className="flex flex-col items-start gap-2">
      <ErrorMessage error={vehicles.error} fallback="No se pudieron cargar los vehículos." />
      <Button variant="secondary" disabled={vehicles.isFetching} onClick={() => void vehicles.refetch()}>Reintentar vehículos</Button>
    </div>}
    {!vehicleId ? <p className="text-sm text-muted">Elegí un vehículo para ver el resumen del día</p>
      : !date ? <p className="text-sm text-muted">Elegí una fecha para ver el resumen.</p>
      : <>
        {summary.isLoading && <p role="status" className="text-sm text-muted">Cargando resumen...</p>}
        {summary.isError && <div className="flex flex-col items-start gap-2">
          <ErrorMessage error={summary.error} fallback="No se pudo actualizar el resumen del día." />
          {data && <p className="text-sm text-muted">Se muestran los últimos datos recibidos.</p>}
          <Button variant="secondary" disabled={summary.isFetching} onClick={() => void summary.refetch()}>Reintentar resumen</Button>
        </div>}
        {data && (data.sessions.length === 0
          ? <p className="ui-card p-3 text-sm text-muted">Ese vehículo no salió el {summaryDateLabel(date)}</p>
          : <div className="flex min-w-0 flex-col gap-4">
            {data.sessions.map((session) => <SessionDailySummaryCard key={session.sessionId} session={session} />)}
            {data.sessions.length > 1 && <section className="ui-card min-w-0" aria-label="Total del día">
              <h2 className="rounded-t bg-brand px-4 py-3 text-base font-semibold text-white">Total del día</h2>
              <div className="flex min-w-0 flex-col gap-4 p-4">
                {!data.dayTotals.isClosed && <p className="text-sm text-muted">Total provisional: suma lo que sigue a bordo y las diferencias de las salidas recibidas. Revisá cada salida para ver su cuadre.</p>}
                {data.dayTotals.pendingSettlements > 0 && <p className="text-sm text-muted">Rendiciones de efectivo pendientes: {data.dayTotals.pendingSettlements}. El declarado y la diferencia del día quedan pendientes hasta completar todas.</p>}
                <DailySummaryMoneyTable money={data.dayTotals.money} isClosed={data.dayTotals.isClosed} label="Dinero total del día" />
                <DailySummaryStockTable products={data.dayTotals.products} totals={data.dayTotals.totals} isClosed={data.dayTotals.isClosed} provisional label="Productos totales del día" />
              </div>
            </section>}
          </div>)}
      </>}
  </Page>
}

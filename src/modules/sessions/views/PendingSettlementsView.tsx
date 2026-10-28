import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, Button, DataTable, ErrorMessage, LinkButton, Page, PageHeader, Select, formatDateTime, formatMoney } from '../../core'
import { vehicleService } from '../../vehicles'
import { sessionService } from '../services/sessionService'
import { countPendingByPlate, filterPendingByPlate, totalPendingCash } from '../utils/pendingSettlements'

export function PendingSettlementsView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const vehicleId = searchParams.get('camion') ?? ''
  const pending = useQuery({
    queryKey: ['sessions', 'pending-settlements'], queryFn: sessionService.getPendingSettlements,
    refetchInterval: 60_000,
  })
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const items = pending.data ?? []
  const fleet = [...(vehicles.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const vehicle = fleet.find((item) => item.id === vehicleId)
  const counts = countPendingByPlate(items)
  const filtered = vehicleId ? (vehicle ? filterPendingByPlate(items, vehicle.licensePlate) : []) : items
  const showVehicle = !vehicleId

  return <Page className="mx-auto flex min-w-0 max-w-7xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Rendiciones pendientes" />
    {pending.isError || vehicles.isError ? <div className="flex flex-col items-start gap-2">
      <ErrorMessage error={pending.error ?? vehicles.error} />
      <Button variant="secondary" onClick={() => { void pending.refetch(); void vehicles.refetch() }}>Reintentar</Button>
    </div> : pending.isPending || vehicles.isPending ? <p role="status">Cargando…</p> : <>
      <div className="min-w-0 w-full sm:max-w-sm">
        <Select label="Camión" className="min-w-0 w-full" value={vehicleId} onChange={(event) => {
          const next = new URLSearchParams(searchParams)
          if (event.target.value) next.set('camion', event.target.value)
          else next.delete('camion')
          setSearchParams(next)
        }}>
          <option value="">Todos ({items.length})</option>
          {vehicleId && !vehicle && <option value={vehicleId}>Camión no disponible (0)</option>}
          {fleet.map((item) => <option key={item.id} value={item.id}>
            {item.name} · {item.licensePlate} ({counts.get(item.licensePlate) ?? 0})
          </option>)}
        </Select>
      </div>
      {!filtered.length ? <p className="ui-card bg-surface p-3 text-sm text-muted">No hay rendiciones pendientes.</p> :
        <DataTable label="Rendiciones pendientes" className="wrap-anywhere">
          <thead><tr>
            <th scope="col">Recibido</th>
            {showVehicle && <th scope="col">Camión</th>}
            <th scope="col">Chofer</th>
            <th scope="col">Zonas</th>
            <th scope="col" className="text-right">Efectivo a entregar</th>
            <th scope="col" data-label=""><span className="sr-only">Acciones</span></th>
          </tr></thead>
          <tbody>{filtered.map((item) => <tr key={item.sessionId}>
            <td>{formatDateTime(item.closedAt, BUSINESS_TIME_ZONE)}</td>
            {showVehicle && <td>{item.vehicleName} · {item.vehicleLicensePlate}</td>}
            <td>{item.driverName}</td>
            <td>{item.zoneName}</td>
            <td className="text-right tabular-nums">{formatMoney(item.cashToDeliver)}</td>
            <td><LinkButton variant="primary" to={`/panel/salidas/${item.sessionId}#liquidacion`}>Rendir</LinkButton></td>
          </tr>)}</tbody>
          <tfoot><tr className="bg-warning-soft font-semibold">
            <th scope="row" colSpan={showVehicle ? 4 : 3} className="max-md:pl-0! before:hidden">Total</th>
            <td className="text-right tabular-nums">{formatMoney(totalPendingCash(filtered))}</td>
            <td className="max-md:hidden!" />
          </tr></tfoot>
        </DataTable>}
    </>}
  </Page>
}

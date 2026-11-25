import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, Button, currentBusinessDate, DataTable, Field, formatMoney, Page, PageHeader, Panel, Select } from '../../core'
import { AdjustContainersDialog } from '../../customers'
import { vehicleService } from '../../vehicles'
import { routeSheetService } from '../services/routeSheetService'
import type { RouteSheetCustomer } from '../services/routeSheetService'
import { containerColumns, containerQuantity, sheetDateLabel } from '../utils/routeSheet'

/**
 * La hoja de ruta en pantalla, para pasar lo que anotaron a mano en la impresa:
 * fila por fila se corrige cuántos envases tiene el cliente en la casa.
 * Las filas corregidas quedan en verde para no perder el hilo.
 */
export function ContainerCorrectionView() {
  const queryClient = useQueryClient()
  const [vehicleId, setVehicleId] = useState('')
  const [date, setDate] = useState(currentBusinessDate)
  const [editing, setEditing] = useState<RouteSheetCustomer | null>(null)
  const [corrected, setCorrected] = useState<ReadonlySet<string>>(new Set())
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const sheet = useQuery({
    queryKey: ['reports', 'route-sheet', vehicleId, date],
    queryFn: () => routeSheetService.get(vehicleId, date),
    enabled: !!vehicleId && !!date,
  })
  const columns = sheet.data ? containerColumns(sheet.data) : []
  const total = sheet.data?.zones.reduce((sum, zone) => sum + zone.customers.length, 0) ?? 0

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-5">
    <PageHeader title="Corregir envases" description="Pasá lo que anotaron en la hoja de ruta impresa." />
    <Panel>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Select label="Camión" value={vehicleId} onChange={(event) => { setVehicleId(event.target.value); setCorrected(new Set()) }}>
          <option value="">Elegí el camión</option>
          {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} · {v.licensePlate}</option>)}
        </Select>
        <Field label="Día de la hoja" type="date" value={date} onChange={(event) => { setDate(event.target.value); setCorrected(new Set()) }} />
      </div>
      {vehicles.isError && <p role="alert" className="text-sm text-danger">No se pudieron cargar los camiones.</p>}
    </Panel>
    {!vehicleId && <p className="text-muted">Elegí el camión de la hoja.</p>}
    {sheet.isLoading && <p role="status" className="text-muted">Cargando la hoja de ruta…</p>}
    {sheet.isError && <p role="alert" className="text-danger">
      {sheet.error instanceof ApiError ? sheet.error.message : 'No se pudo cargar la hoja de ruta.'}
    </p>}
    {sheet.data && (total === 0 ? <p>Este camión no tiene clientes ese día.</p> : <>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">{sheetDateLabel(sheet.data.date)}</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" />Corregido ({corrected.size} de {total})</span>
      </p>
      <DataTable label="Envases de los clientes de la hoja" className="min-w-[48rem]">
        <thead><tr>
          <th scope="col" className="w-16">Orden</th>
          <th scope="col">Nombre</th>
          <th scope="col">Dirección</th>
          {columns.map((c) => <th key={c.productId} scope="col" className="text-right">{c.productDetail}</th>)}
          <th scope="col" className="text-right">Saldo</th>
          <th scope="col"><span className="sr-only">Corregir</span></th>
        </tr></thead>
        <tbody>{sheet.data.zones.map((zone) => [
          sheet.data.zones.length > 1 && <tr key={zone.zoneId}>
            <th colSpan={columns.length + 5} scope="colgroup" className="bg-canvas text-left">{zone.zoneName}</th>
          </tr>,
          ...zone.customers.map((c) => <tr key={c.customerId} className={corrected.has(c.customerId) ? '[&>td]:bg-green-100' : ''}>
            <td className="tabular-nums">{c.routeOrder}</td>
            <td className="font-semibold">{c.displayName}</td>
            <td>{c.address}</td>
            {columns.map((col) => <td key={col.productId} className="text-right tabular-nums">{containerQuantity(c, col.productId) || ''}</td>)}
            <td className="text-right whitespace-nowrap tabular-nums">{formatMoney(c.balance)}</td>
            <td className="text-right">
              <Button variant="edit" className="min-h-11 min-w-11 px-0" aria-label={`Corregir envases de ${c.displayName}`} title="Corregir envases" onClick={() => setEditing(c)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </Button>
            </td>
          </tr>),
        ])}</tbody>
      </DataTable>
    </>)}
    {editing && sheet.data && <AdjustContainersDialog key={editing.customerId} customerId={editing.customerId} containers={editing.containers}
      title={`${editing.routeOrder}. ${editing.displayName}`}
      defaultReason={`Planilla hoja de ruta ${sheetDateLabel(sheet.data.date)}`}
      onSaved={() => {
        setCorrected((prev) => new Set(prev).add(editing.customerId))
        void queryClient.invalidateQueries({ queryKey: ['reports', 'route-sheet'] })
      }}
      onClose={() => setEditing(null)} />}
  </Page>
}

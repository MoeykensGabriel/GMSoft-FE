import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError, Button, currentBusinessDate, Field, formatMoney, Page, PageHeader, Panel, Select } from '../../core'
import { vehicleService } from '../../vehicles'
import { routeSheetService } from '../services/routeSheetService'
import { containerColumns, containerQuantity, sheetDateLabel, sheetFileTitle } from '../utils/routeSheet'
import type { RouteSheet } from '../services/routeSheetService'

/**
 * La hoja de ruta de un camión para imprimir o guardar en PDF: arriba el camión y la
 * fecha, y debajo todos los clientes del día en orden de recorrido, con sus envases y
 * su saldo. Lo demás de la pantalla no sale en el papel.
 */
export function RouteSheetView() {
  const [vehicleId, setVehicleId] = useState('')
  const [date, setDate] = useState(currentBusinessDate)
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const sheet = useQuery({
    queryKey: ['reports', 'route-sheet', vehicleId, date],
    queryFn: () => routeSheetService.get(vehicleId, date),
    enabled: !!vehicleId && !!date,
  })

  const imprimir = (hoja: RouteSheet) => {
    // El título de la página es el nombre que el navegador propone para el PDF.
    const anterior = document.title
    document.title = sheetFileTitle(hoja)
    window.print()
    document.title = anterior
  }

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6 print:max-w-none print:p-0">
    <div className="flex flex-col gap-5 print:hidden">
      <PageHeader title="Hoja de ruta" description="Los clientes del camión para el día elegido, para imprimir o guardar en PDF." />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Select label="Camión" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
            <option value="">Elegí el camión</option>
            {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} · {v.licensePlate}</option>)}
          </Select>
          <Field label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Button disabled={!sheet.data} onClick={() => sheet.data && imprimir(sheet.data)}>Imprimir o guardar PDF</Button>
        </div>
        {vehicles.isError && <p role="alert" className="text-sm text-danger">No se pudieron cargar los camiones.</p>}
      </Panel>
      {sheet.isLoading && <p role="status" className="text-muted">Cargando la hoja de ruta…</p>}
      {sheet.isError && <p role="alert" className="text-danger">
        {sheet.error instanceof ApiError ? sheet.error.message : 'No se pudo cargar la hoja de ruta.'}
      </p>}
    </div>
    {sheet.data && <SheetPaper sheet={sheet.data} />}
  </Page>
}

function SheetPaper({ sheet }: { sheet: RouteSheet }) {
  const columnas = containerColumns(sheet)
  const total = sheet.zones.reduce((suma, zona) => suma + zona.customers.length, 0)
  const ancho = 4 + columnas.length

  return <article className="rounded border border-line bg-white p-4 text-sm text-black print:rounded-none print:border-0 print:p-0 print:text-[11px]">
    <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 border-b-2 border-black pb-2">
      <h2 className="text-xl font-bold">{sheet.vehicleName} · {sheet.licensePlate}</h2>
      <p className="text-lg font-semibold">{sheetDateLabel(sheet.date)}</p>
    </header>
    {total === 0 ? <p>Este camión no tiene clientes ese día.</p> : <div className="overflow-x-auto print:overflow-visible"><table className="w-full min-w-[40rem] border-collapse print:min-w-0">
      <thead>
        <tr className="border-b border-black text-left">
          <th className="w-12 py-1 pr-2">Recorrido</th>
          <th className="py-1 pr-2">Cliente</th>
          <th className="py-1 pr-2">Dirección</th>
          {columnas.map((c) => <th key={c.productId} className="py-1 pr-2 text-right">{c.productDetail}</th>)}
          <th className="py-1 text-right">Saldo</th>
        </tr>
      </thead>
      <tbody>
        {sheet.zones.map((zona) => [
          // Con una sola zona el título no agrega nada.
          sheet.zones.length > 1 && <tr key={zona.zoneId} className="break-inside-avoid">
            <th colSpan={ancho} className="bg-gray-200 px-1 py-1 text-left">{zona.zoneName}</th>
          </tr>,
          ...zona.customers.map((c) => <tr key={c.customerId} className="break-inside-avoid border-b border-gray-300 align-top">
            <td className="py-1 pr-2">{c.routeOrder}</td>
            <td className="py-1 pr-2 font-semibold">{c.displayName}</td>
            <td className="py-1 pr-2">{c.address}</td>
            {columnas.map((col) => <td key={col.productId} className="py-1 pr-2 text-right">{containerQuantity(c, col.productId) || ''}</td>)}
            <td className="py-1 text-right whitespace-nowrap">{formatMoney(c.balance)}</td>
          </tr>),
        ])}
      </tbody>
    </table></div>}
  </article>
}

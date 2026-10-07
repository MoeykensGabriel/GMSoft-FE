import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Field, ErrorMessage, Select, weekdayLabels, weekdayOfDate } from '../../core'
import { vehicleService } from '../../vehicles'
import { customerService } from '../services/customerService'
import { visitDaysLabel } from '../utils/visitDays'

export function CustomerListView() {
  const [vehicleId, setVehicleId] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const vehicles = useQuery({ queryKey: ['vehicles', 'customer-options'], queryFn: () => vehicleService.listAll() })
  // Los clientes tienen días de visita semanales: la fecha elegida se traduce a su día.
  const visitDay = date ? weekdayOfDate(date) : null
  const ready = vehicleId !== '' && visitDay !== null
  const customers = useQuery({
    queryKey: ['customers', 'admin', vehicleId, visitDay, page, search],
    queryFn: () => customerService.listByVehicleAndDay(vehicleId, visitDay!, page, search),
    enabled: ready,
  })
  return <main className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <Link to="/panel/clientes/nuevo" className="rounded-md bg-green-700 px-4 py-3 text-white">Nuevo cliente</Link>
    </div>
    {vehicles.isError && <ErrorMessage error={vehicles.error} />}
    <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(draft.trim()) }}>
      <Select label="Camión asignado" name="vehicleId" value={vehicleId} disabled={vehicles.isPending} onChange={(event) => { setPage(1); setVehicleId(event.target.value) }}>
        <option value="">{vehicles.isPending ? 'Cargando…' : 'Seleccionar camión'}</option>
        {vehicles.data?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
      </Select>
      <Field label="Fecha" name="date" type="date" value={date} onChange={(event) => { setPage(1); setDate(event.target.value) }} />
      <Field label="Buscar por nombre, dirección o teléfono" name="search" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <Button type="submit" variant="secondary">Buscar</Button>
    </form>
    {!ready ? <p className="text-neutral-600">Elegí un camión y una fecha para ver los clientes.</p>
      : customers.isPending ? <p>Cargando…</p> : customers.isError ? <div><ErrorMessage error={customers.error} /><Button variant="secondary" onClick={() => customers.refetch()}>Reintentar</Button></div>
      : <>
        <p className="text-sm text-neutral-600">{customers.data.totalCount} clientes · {weekdayLabels([visitDay])}</p>
        {customers.data.items.length === 0 && <p>No se encontraron clientes.</p>}
        <ul className="grid gap-3 md:grid-cols-2">
          {customers.data.items.map((customer) => <li key={customer.id} className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4">
            <h2 className="font-semibold">{customer.displayName}{!customer.isActive && ' (inactivo)'}</h2>
            <p>{customer.address} · {customer.phone}</p>
            <p className="text-sm">{customer.zoneName} · Orden {customer.routeOrder}</p>
            <p className="text-sm">Camión: {customer.vehicleId ? `${customer.vehicleName} · ${customer.vehicleLicensePlate}` : 'Sin camión asignado'}</p>
            <p className="text-sm">{visitDaysLabel(customer.visitDays)}</p>
            <Link to={`/panel/clientes/${customer.id}`} className="self-start py-2 underline">Editar cliente</Link>
          </li>)}
        </ul>
        <div className="flex items-center gap-3">
          <Button variant="secondary" disabled={!customers.data.hasPreviousPage} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={!customers.data.hasNextPage} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      </>}
  </main>
}

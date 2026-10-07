import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, DataTable, Field, ErrorMessage, ManagementHeader, Pagination, Select, weekdayLabels, weekdayOfDate, Page } from '../../core'
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
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <ManagementHeader title="Clientes" description="Consultá los clientes por camión y día de visita." createTo="/panel/clientes/nuevo" createLabel="Nuevo cliente" />
    {vehicles.isError && <ErrorMessage error={vehicles.error} />}
    <form className="ui-toolbar grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_12rem_1.5fr_auto]" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(draft.trim()) }}>
      <Select label="Camión asignado" name="vehicleId" value={vehicleId} disabled={vehicles.isPending} onChange={(event) => { setPage(1); setVehicleId(event.target.value) }}>
        <option value="">{vehicles.isPending ? 'Cargando…' : 'Seleccionar camión'}</option>
        {vehicles.data?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
      </Select>
      <Field label="Fecha" name="date" type="date" value={date} onChange={(event) => { setPage(1); setDate(event.target.value) }} />
      <Field label="Buscar por nombre, dirección o teléfono" name="search" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <Button type="submit" variant="secondary">Buscar</Button>
    </form>
    {!ready ? <p className="text-muted">Elegí un camión y una fecha para ver los clientes.</p>
      : customers.isPending ? <p>Cargando…</p> : customers.isError ? <div><ErrorMessage error={customers.error} /><Button variant="secondary" onClick={() => customers.refetch()}>Reintentar</Button></div>
      : <>
        <p className="text-sm text-muted">{customers.data.totalCount} clientes · {weekdayLabels([visitDay])}</p>
        {customers.data.items.length === 0 && <p>No se encontraron clientes.</p>}
        {customers.data.items.length > 0 && <DataTable label="Clientes del camión y día seleccionados" className="min-w-[52rem]">
          <thead><tr><th scope="col">Cliente</th><th scope="col">Dirección / teléfono</th><th scope="col">Zona</th><th scope="col">Camión</th><th scope="col">Días de visita</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{customers.data.items.map((customer) => <tr key={customer.id}>
            <td><span className="font-semibold">{customer.displayName}</span><span className="block text-xs text-muted">Orden {customer.routeOrder}</span>{!customer.isActive && <Badge>Inactivo</Badge>}</td>
            <td>{customer.address}<span className="block text-xs text-muted">{customer.phone}</span></td><td>{customer.zoneName}</td>
            <td>{customer.vehicleId ? <>{customer.vehicleName}<span className="block text-xs text-muted">{customer.vehicleLicensePlate}</span></> : 'Sin camión asignado'}</td>
            <td>{visitDaysLabel(customer.visitDays)}</td><td><Link to={`/panel/clientes/${customer.id}`} className="ui-link inline-flex min-h-11 items-center" aria-label={`Editar cliente ${customer.displayName}`}>Editar</Link></td>
          </tr>)}</tbody>
        </DataTable>}
        <Pagination {...customers.data} onChange={setPage} />
      </>}
  </Page>
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, DataTable, Field, ErrorMessage, ManagementHeader, Pagination, Select, WEEKDAYS, formatDate, Page } from '../../core'
import { vehicleService } from '../../vehicles'
import { customerService } from '../services/customerService'
import type { Customer } from '../services/customerService'
import { purchaseActivityLabel } from '../utils/activity'
import { visitDaysLabel } from '../utils/visitDays'

// El color acompaña al texto: rojo y negro son los mismos umbrales que ve el chofer.
const ACTIVITY_ROW: Record<Customer['activityStatus'], string> = {
  White: '',
  Red: 'bg-danger-soft',
  Black: 'bg-neutral-900 text-white',
}

export function CustomerListView() {
  const [vehicleId, setVehicleId] = useState('')
  const [visitDay, setVisitDay] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const vehicles = useQuery({ queryKey: ['vehicles', 'customer-options'], queryFn: () => vehicleService.listAll() })
  const ready = vehicleId !== ''
  const customers = useQuery({
    queryKey: ['customers', 'admin', vehicleId, visitDay, page, search],
    queryFn: () => customerService.listByVehicle(vehicleId, visitDay, page, search),
    enabled: ready,
  })
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <ManagementHeader title="Clientes" description="Consultá los clientes de cada camión y cómo vienen comprando." createTo="/panel/clientes/nuevo" createLabel="Nuevo cliente" />
    {vehicles.isError && <ErrorMessage error={vehicles.error} />}
    <form className="ui-toolbar grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_12rem_1.5fr_auto]" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(draft.trim()) }}>
      <Select label="Camión asignado" name="vehicleId" value={vehicleId} disabled={vehicles.isPending} onChange={(event) => { setPage(1); setVehicleId(event.target.value) }}>
        <option value="">{vehicles.isPending ? 'Cargando…' : 'Seleccionar camión'}</option>
        {vehicles.data?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
      </Select>
      <Select label="Día de visita" name="visitDay" value={visitDay ?? ''} onChange={(event) => { setPage(1); setVisitDay(event.target.value === '' ? null : Number(event.target.value)) }}>
        <option value="">Todos los días</option>
        {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
      </Select>
      <Field label="Buscar por nombre, dirección o teléfono" name="search" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <Button type="submit" variant="secondary">Buscar</Button>
    </form>
    {!ready ? <p className="text-muted">Elegí un camión para ver sus clientes.</p>
      : customers.isPending ? <p>Cargando…</p> : customers.isError ? <div><ErrorMessage error={customers.error} /><Button variant="secondary" onClick={() => customers.refetch()}>Reintentar</Button></div>
      : <>
        <p className="text-sm text-muted">{customers.data.totalCount} clientes</p>
        {customers.data.items.length === 0 && <p>No se encontraron clientes.</p>}
        {customers.data.items.length > 0 && <DataTable label="Clientes del camión seleccionado" className="min-w-[60rem]">
          <thead><tr><th scope="col">Cliente</th><th scope="col">Dirección / teléfono</th><th scope="col">Zona</th><th scope="col">Camión</th><th scope="col">Días de visita</th><th scope="col">Compras</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{customers.data.items.map((customer) => {
            const dark = customer.activityStatus === 'Black'
            const detail = `block text-xs ${dark ? '' : 'text-muted'}`
            return <tr key={customer.id} className={ACTIVITY_ROW[customer.activityStatus]}>
              <td><span className="font-semibold">{customer.displayName}</span><span className={detail}>Orden {customer.routeOrder}</span>{!customer.isActive && <Badge>Inactivo</Badge>}</td>
              <td>{customer.address}<span className={detail}>{customer.phone}</span></td><td>{customer.zoneName}</td>
              <td>{customer.vehicleId ? <>{customer.vehicleName}<span className={detail}>{customer.vehicleLicensePlate}</span></> : 'Sin camión asignado'}</td>
              <td>{visitDaysLabel(customer.visitDays)}</td>
              <td><span className="font-semibold">{purchaseActivityLabel(customer.weeksWithoutPurchase, customer.lastPurchaseAt === null)}</span>
                {customer.lastPurchaseAt && <span className={detail}>Última compra: {formatDate(customer.lastPurchaseAt)}</span>}</td>
              <td><Link to={`/panel/clientes/${customer.id}`} className={`inline-flex min-h-11 items-center ${dark ? 'underline' : 'ui-link'}`} aria-label={`Editar cliente ${customer.displayName}`}>Editar</Link></td>
            </tr>
          })}</tbody>
        </DataTable>}
        <Pagination {...customers.data} onChange={setPage} />
      </>}
  </Page>
}

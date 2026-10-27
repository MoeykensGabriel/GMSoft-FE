import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, DataTable, Field, ErrorMessage, ManagementHeader, Pagination, Select, WEEKDAYS, Page } from '../../core'
import { vehicleService } from '../../vehicles'
import { customerService } from '../services/customerService'
import type { Customer } from '../services/customerService'
import { customerListActivityLabel } from '../utils/activity'
import { visitDaysLabel } from '../utils/visitDays'

// El color acompaña al texto: rojo y negro son los mismos umbrales que ve el chofer.
const ACTIVITY_ROW: Record<Customer['activityStatus'], string> = {
  White: '',
  Red: 'bg-danger-soft',
  Black: 'bg-neutral-900 text-white',
}

export function CustomerListView() {
  const navigate = useNavigate()
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
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-5">
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
        {customers.data.items.length > 0 && <DataTable label="Clientes del camión seleccionado" className="min-w-[56rem] md:table-fixed md:[&_th]:px-2 md:[&_td]:px-2">
          <thead><tr><th scope="col" className="md:w-[18%]">Cliente</th><th scope="col" className="md:w-[20%]">Dirección / teléfono</th><th scope="col" className="md:w-[16%]">Zona</th><th scope="col" className="md:w-[13%]">Camión</th><th scope="col" className="md:w-[12%]">Días de visita</th><th scope="col" className="md:w-[21%]">Compras</th></tr></thead>
          <tbody>{customers.data.items.map((customer) => {
            const dark = customer.activityStatus === 'Black'
            const detail = `block text-xs ${dark ? '' : 'text-muted'}`
            const customerPath = `/panel/clientes/${encodeURIComponent(customer.id)}`
            return <tr key={customer.id} className={`cursor-pointer ${ACTIVITY_ROW[customer.activityStatus]}`} title="Doble clic para editar" onDoubleClick={(event) => {
              if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea')) return
              navigate(`${customerPath}/editar`)
            }}>
              <td><Link to={customerPath} className="inline-flex min-h-11 items-center font-semibold underline" aria-label={`Ver cliente ${customer.displayName}`}>{customer.displayName}</Link><span className={detail}>Orden {customer.routeOrder}</span>{!customer.isActive && <Badge>Inactivo</Badge>}{customer.removalPending && <Badge tone="warning">Baja pedida</Badge>}</td>
              <td>{customer.address}<span className={detail}>{customer.phone}</span></td><td className="[overflow-wrap:normal] break-normal md:min-w-36">{customer.zoneName}</td>
              <td className="[overflow-wrap:normal] break-normal ui-stack-hide">{customer.vehicleId ? <>{customer.vehicleName}<span className={detail}>{customer.vehicleLicensePlate}</span></> : 'Sin camión asignado'}</td>
              <td className="ui-stack-hide">{visitDaysLabel(customer.visitDays)}</td>
              <td><span className="font-semibold">{customerListActivityLabel(customer.weeksWithoutPurchase)}</span></td>
            </tr>
          })}</tbody>
        </DataTable>}
        <Pagination {...customers.data} onChange={setPage} />
      </>}
  </Page>
}

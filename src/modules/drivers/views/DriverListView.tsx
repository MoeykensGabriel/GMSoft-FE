import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, Button, DataTable, ErrorMessage, Field, ManagementHeader, Pagination, Select, Page } from '../../core'
import { driverService } from '../services/driverService'

export function DriverListView() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(1)
  const drivers = useQuery({ queryKey: ['drivers', 'admin', page, search, active], queryFn: () => driverService.listPage(page, search, active) })
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6">
    <ManagementHeader title="Choferes" description="Creá sus usuarios y asignales el vehículo con el que saldrán a repartir." createTo="/panel/choferes/nuevo" createLabel="Nuevo chofer" />
    <div className="ui-toolbar grid gap-3 sm:grid-cols-[1fr_12rem]">
      <Field label="Buscar por nombre o documento" name="driverSearch" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      <Select label="Estado" name="activeFilter" value={active} onChange={(e) => { setActive(e.target.value); setPage(1) }}>
        <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
      </Select>
    </div>
    {drivers.isPending ? <p role="status">Cargando choferes...</p> : drivers.isError ? <div><ErrorMessage error={drivers.error} /><Button variant="secondary" onClick={() => drivers.refetch()}>Reintentar</Button></div> : <>
      <p className="text-sm text-muted">{drivers.data.totalCount} choferes</p>
      {!drivers.data.items.length ? <p>{search || active ? 'No se encontraron choferes para estos filtros.' : 'Todavía no hay choferes. Creá uno con su usuario de acceso y un vehículo asignado.'}</p> : <DataTable label="Choferes registrados" className="min-w-[48rem]">
        <thead><tr><th scope="col">Chofer</th><th scope="col">Usuario</th><th scope="col">Contacto</th><th scope="col">Vehículo</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
        <tbody>{drivers.data.items.map((driver) => <tr key={driver.id}>
          <td className="font-semibold">{driver.firstName} {driver.lastName}<span className="block text-xs font-normal text-muted">DNI {driver.documentNumber}</span></td>
          <td>{driver.userName ?? 'Sin usuario vinculado'}</td><td>{driver.phone}</td>
          <td>{driver.vehicleId ? <>{driver.vehicleName ?? 'Vehículo'}<span className="block text-xs text-muted">{driver.vehicleLicensePlate}</span></> : 'Sin asignar: no puede iniciar un reparto'}</td>
          <td><Badge tone={driver.isActive ? 'success' : 'neutral'}>{driver.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
          <td><Link to={`/panel/choferes/${driver.id}`} className="ui-link inline-flex min-h-11 items-center" aria-label={`Editar chofer ${driver.firstName} ${driver.lastName}`}>Editar / contraseña</Link></td>
        </tr>)}</tbody>
      </DataTable>}
      <Pagination {...drivers.data} onChange={setPage} />
    </>}
  </Page>
}

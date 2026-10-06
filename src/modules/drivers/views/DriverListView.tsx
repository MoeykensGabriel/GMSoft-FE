import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, ErrorMessage, Field, ManagementHeader, Pagination, Select } from '../../core'
import { driverService } from '../services/driverService'

export function DriverListView() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(1)
  const drivers = useQuery({ queryKey: ['drivers', 'admin', page, search, active], queryFn: () => driverService.listPage(page, search, active) })
  return <main className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6">
    <ManagementHeader title="Choferes" description="Creá sus usuarios y asignales el vehículo con el que saldrán a repartir." createTo="/panel/choferes/nuevo" createLabel="Nuevo chofer" />
    <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
      <Field label="Buscar por nombre o documento" name="driverSearch" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      <Select label="Estado" name="activeFilter" value={active} onChange={(e) => { setActive(e.target.value); setPage(1) }}>
        <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
      </Select>
    </div>
    {drivers.isPending ? <p role="status">Cargando choferes...</p> : drivers.isError ? <div><ErrorMessage error={drivers.error} /><Button variant="secondary" onClick={() => drivers.refetch()}>Reintentar</Button></div> : <>
      <p className="text-sm text-neutral-600">{drivers.data.totalCount} choferes</p>
      {!drivers.data.items.length ? <p>{search || active ? 'No se encontraron choferes para estos filtros.' : 'Todavía no hay choferes. Creá uno con su usuario de acceso y un vehículo asignado.'}</p> : <ul className="grid gap-3 lg:grid-cols-2">
        {drivers.data.items.map((driver) => <li key={driver.id} className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4">
          <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{driver.firstName} {driver.lastName}</h2><span className="text-sm">{driver.isActive ? 'Activo' : 'Inactivo'}</span></div>
          <p className="break-words text-sm">Usuario: {driver.userName ?? 'Sin usuario vinculado'}</p>
          <p className="text-sm">Documento: {driver.documentNumber} · Teléfono: {driver.phone}</p>
          <p className="text-sm">Vehículo: {driver.vehicleId ? `${driver.vehicleName ?? 'Vehículo'} · ${driver.vehicleLicensePlate ?? ''}` : 'Sin asignar: no puede iniciar un reparto'}</p>
          <Link to={`/panel/choferes/${driver.id}`} className="mt-2 self-start text-sm underline">Editar chofer / contraseña</Link>
        </li>)}
      </ul>}
      <Pagination {...drivers.data} onChange={setPage} />
    </>}
  </main>
}

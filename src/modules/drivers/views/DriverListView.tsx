import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, DataTable, ErrorMessage, Field, LinkButton, ManagementHeader, Pagination, Select, Page, WhatsAppButton } from '../../core'
import { driverService } from '../services/driverService'

export function DriverListView() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
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
        <thead><tr><th scope="col">Chofer</th><th scope="col">Usuario</th><th scope="col">Contraseña</th><th scope="col">Contacto</th><th scope="col">Vehículo</th><th scope="col">Estado</th><th scope="col" className="w-16"><span className="sr-only">Editar</span></th></tr></thead>
        {/* Doble clic en la fila abre la ficha; el lápiz hace lo mismo con un toque o el teclado. */}
        <tbody>{drivers.data.items.map((driver) => <tr key={driver.id} className="cursor-pointer" title="Doble clic para editar"
          onDoubleClick={() => navigate(`/panel/choferes/${driver.id}`)}>
          <td className="font-semibold">{driver.firstName} {driver.lastName}</td>
          <td>{driver.userName ?? 'Sin usuario vinculado'}</td>
          <td>{driver.password ? <span className="font-mono">{driver.password}</span>
            : <span className="text-sm text-muted" title="Se ve desde la próxima vez que se la cambies">Cambiala para verla</span>}</td>
          <td><div className="flex flex-wrap items-center gap-2"><span>{driver.phone}</span><WhatsAppButton phone={driver.phone} name={`${driver.firstName} ${driver.lastName}`} /></div></td>
          <td>{driver.vehicleId ? <>{driver.vehicleName ?? 'Vehículo'}<span className="block text-xs text-muted">{driver.vehicleLicensePlate}</span></> : 'Sin asignar: no puede iniciar un reparto'}</td>
          <td><Badge tone={driver.isActive ? 'success' : 'neutral'}>{driver.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
          <td><LinkButton to={`/panel/choferes/${driver.id}`} className="min-h-11 min-w-11 px-0" aria-label={`Editar chofer ${driver.firstName} ${driver.lastName}`} title="Editar">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </LinkButton></td>
        </tr>)}</tbody>
      </DataTable>}
      <Pagination {...drivers.data} onChange={setPage} />
    </>}
  </Page>
}

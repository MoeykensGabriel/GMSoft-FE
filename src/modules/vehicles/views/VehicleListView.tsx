import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, ErrorMessage, Field, ManagementHeader, Pagination } from '../../core'
import { vehicleService } from '../services/vehicleService'
import { vehicleTypeLabels } from '../utils/vehicleTypeLabels'

export function VehicleListView() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const vehicles = useQuery({ queryKey: ['vehicles', 'admin', page, search], queryFn: () => vehicleService.listPage(page, search) })
  return <main className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6">
    <ManagementHeader title="Vehículos" description="Registrá los vehículos que podrán llevar los productos del reparto." createTo="/panel/vehiculos/nuevo" createLabel="Nuevo vehículo" />
    <Field label="Buscar por nombre o patente" name="vehicleSearch" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
    {vehicles.isPending ? <p role="status">Cargando vehículos...</p> : vehicles.isError ? <div><ErrorMessage error={vehicles.error} /><Button variant="secondary" onClick={() => vehicles.refetch()}>Reintentar</Button></div> : <>
      <p className="text-sm text-neutral-600">{vehicles.data.totalCount} vehículos</p>
      {!vehicles.data.items.length ? <p>{search ? 'No se encontraron vehículos para esta búsqueda.' : 'Todavía no hay vehículos. Creá el primero para asignarlo a un chofer y preparar su carga.'}</p> : <ul className="grid gap-3 lg:grid-cols-2">
        {vehicles.data.items.map((vehicle) => <li key={vehicle.id} className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4">
          <h2 className="font-semibold">{vehicle.name} · {vehicle.licensePlate}</h2>
          <p className="text-sm">{vehicleTypeLabels[vehicle.type]} · {vehicle.currentKilometers.toLocaleString('es-AR')} km</p>
          <Link to={`/panel/vehiculos/${vehicle.id}`} className="self-start text-sm underline">Editar vehículo</Link>
        </li>)}
      </ul>}
      <Pagination {...vehicles.data} onChange={setPage} />
    </>}
  </main>
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, DataTable, ErrorMessage, Field, ManagementHeader, Pagination, Page } from '../../core'
import { vehicleService } from '../services/vehicleService'
import { vehicleTypeLabels } from '../utils/vehicleTypeLabels'

export function VehicleListView() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const vehicles = useQuery({ queryKey: ['vehicles', 'admin', page, search], queryFn: () => vehicleService.listPage(page, search) })
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6">
    <ManagementHeader title="Vehículos" description="Registrá los vehículos que podrán llevar los productos del reparto." createTo="/panel/vehiculos/nuevo" createLabel="Nuevo vehículo" />
    <Field label="Buscar por nombre o patente" name="vehicleSearch" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
    {vehicles.isPending ? <p role="status">Cargando vehículos...</p> : vehicles.isError ? <div><ErrorMessage error={vehicles.error} /><Button variant="secondary" onClick={() => vehicles.refetch()}>Reintentar</Button></div> : <>
      <p className="text-sm text-muted">{vehicles.data.totalCount} vehículos</p>
      {!vehicles.data.items.length ? <p>{search ? 'No se encontraron vehículos para esta búsqueda.' : 'Todavía no hay vehículos. Creá el primero para asignarlo a un chofer y preparar su carga.'}</p> : <DataTable label="Vehículos registrados" className="min-w-[36rem]">
        <thead><tr><th scope="col">Vehículo</th><th scope="col">Patente</th><th scope="col">Tipo</th><th scope="col" className="text-right">Kilómetros</th><th scope="col">Acciones</th></tr></thead>
        <tbody>{vehicles.data.items.map((vehicle) => <tr key={vehicle.id}>
          <td className="font-semibold">{vehicle.name}</td><td>{vehicle.licensePlate}</td><td>{vehicleTypeLabels[vehicle.type]}</td>
          <td className="text-right tabular-nums">{vehicle.currentKilometers.toLocaleString('es-AR')}</td>
          <td><Link to={`/panel/vehiculos/${vehicle.id}`} className="ui-link inline-flex min-h-11 items-center" aria-label={`Editar vehículo ${vehicle.name}`}>Editar</Link></td>
        </tr>)}</tbody>
      </DataTable>}
      <Pagination {...vehicles.data} onChange={setPage} />
    </>}
  </Page>
}

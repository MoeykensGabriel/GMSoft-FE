import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorMessage } from '../../core'
import { VehicleForm } from '../components/VehicleForm'
import { vehicleService } from '../services/vehicleService'
import type { VehicleInput } from '../services/vehicleService'

export function VehicleFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const vehicle = useQuery({ queryKey: ['vehicles', 'detail', id], queryFn: () => vehicleService.getById(id!), enabled: Boolean(id) })
  const save = useMutation({
    mutationFn: async (input: VehicleInput) => {
      if (id) await vehicleService.update(id, input)
      else await vehicleService.create(input)
    },
    onSuccess: async () => {
      await Promise.all(['vehicles', 'drivers', 'customers', 'sessions'].map((key) => client.invalidateQueries({ queryKey: [key] })))
      navigate('/panel/vehiculos')
    },
  })
  if (id && vehicle.isPending) return <p className="p-6">Cargando vehículo...</p>
  if (id && vehicle.isError) return <div className="flex flex-col gap-3 p-6"><ErrorMessage error={vehicle.error} /><Button variant="secondary" onClick={() => vehicle.refetch()}>Reintentar</Button><Link to="/panel/vehiculos">Volver a vehículos</Link></div>

  return <main className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-6">
    <Link to="/panel/vehiculos" className="text-sm underline">← Vehículos</Link>
    <h1 className="text-xl font-semibold">{id ? 'Editar vehículo' : 'Nuevo vehículo'}</h1>
    <VehicleForm key={id ?? 'new'} initial={vehicle.data} saving={save.isPending} error={save.error} onSubmit={(input) => save.mutate(input)} />
  </main>
}

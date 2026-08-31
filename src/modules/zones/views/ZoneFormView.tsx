import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ZoneForm } from '../components/ZoneForm'
import { zoneService } from '../services/zoneService'
import type { ZoneInput } from '../services/zoneService'

/** Alta y edicion de una zona, la misma pantalla segun haya id en la ruta. */
export function ZoneFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const zona = useQuery({
    queryKey: ['zones', 'detail', id],
    queryFn: () => zoneService.getById(id!),
    enabled: Boolean(id),
  })

  const guardar = useMutation({
    // El alta devuelve el id y la edicion no devuelve nada; aca no se usa ninguno,
    // asi que la mutacion se queda sin resultado y las dos ramas encajan.
    mutationFn: async (input: ZoneInput) => {
      if (id) await zoneService.update(id, input)
      else await zoneService.create(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      navigate('/panel/zonas')
    },
  })

  if (id && zona.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (id && !zona.data) return <p className="p-6 text-red-600">No se encontró la zona.</p>

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <div>
        <Link to="/panel/zonas" className="text-sm text-slate-500 hover:underline">
          ← Zonas
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          {id ? 'Editar zona' : 'Nueva zona'}
        </h1>
      </div>

      <ZoneForm
        inicial={zona.data}
        guardando={guardar.isPending}
        error={guardar.error}
        onSubmit={(input) => guardar.mutate(input)}
      />
    </main>
  )
}

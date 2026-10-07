import { Page, PageHeader } from '../../core'
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

  if (id && zona.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (id && !zona.data) return <p className="p-6 text-danger">No se encontró la zona.</p>

  return (
    <Page className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div>
        <Link to="/panel/zonas" className="text-sm text-muted hover:underline">
          ← Zonas
        </Link>
        <PageHeader title={<>
          {id ? 'Editar zona' : 'Nueva zona'}
        </>} />
      </div>

      <ZoneForm
        inicial={zona.data}
        guardando={guardar.isPending}
        error={guardar.error}
        onSubmit={(input) => guardar.mutate(input)}
      />
    </Page>
  )
}

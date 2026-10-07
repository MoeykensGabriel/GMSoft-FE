import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ErrorMessage, Page, Badge, Button, DataTable, ManagementHeader } from '../../core'
import { zoneService } from '../services/zoneService'
import type { Zone } from '../services/zoneService'

/**
 * Las zonas de reparto. Son la unidad del recorrido: el chofer elige una al salir y
 * el dia son los clientes de esa zona, en orden.
 */
export function ZoneListView() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<unknown>(null)

  const zonas = useQuery({ queryKey: ['zones', 'all'], queryFn: () => zoneService.list() })

  function alTerminar() {
    setError(null)
    queryClient.invalidateQueries({ queryKey: ['zones'] })
  }

  const activar = useMutation({
    mutationFn: (z: Zone) =>
      zoneService.update(z.id, { name: z.name, notes: z.notes, isActive: !z.isActive }),
    onSuccess: alTerminar,
    onError: (e) => setError(e),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => zoneService.remove(id),
    onSuccess: alTerminar,
    onError: (e) => setError(e),
  })

  if (zonas.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (zonas.isError) return <p className="p-6 text-danger">No se pudieron leer las zonas.</p>

  const items = zonas.data?.items ?? []

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
      <ManagementHeader title="Zonas de reparto" description="Localidades y zonas disponibles para organizar el recorrido." createTo="/panel/zonas/nueva" createLabel="Nueva zona" />
      <ErrorMessage error={error} />
      {items.length === 0 ? <p className="text-sm text-muted">Todavía no hay zonas. Sin al menos una, el chofer no puede abrir su salida.</p> :
        <DataTable label="Zonas de reparto" className="min-w-[36rem]">
          <thead><tr><th scope="col">Zona</th><th scope="col">Notas</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{items.map((z) => <tr key={z.id}>
            <td className="font-semibold">{z.name}</td><td>{z.notes || '—'}</td>
            <td><Badge tone={z.isActive ? 'success' : 'neutral'}>{z.isActive ? 'Activa' : 'Inactiva'}</Badge></td>
            <td><div className="flex flex-wrap items-center gap-2">
              <Link to={`/panel/zonas/${z.id}`} className="ui-link inline-flex min-h-11 items-center" aria-label={`Editar zona ${z.name}`}>Editar</Link>
              <Button type="button" variant="secondary" onClick={() => activar.mutate(z)} disabled={activar.isPending}>{z.isActive ? 'Desactivar' : 'Activar'}</Button>
              <Button type="button" variant="danger" disabled={eliminar.isPending} onClick={() => { if (confirm(`¿Eliminar la zona "${z.name}"?`)) eliminar.mutate(z.id) }}>Eliminar</Button>
            </div></td>
          </tr>)}</tbody>
        </DataTable>}
    </Page>
  )
}

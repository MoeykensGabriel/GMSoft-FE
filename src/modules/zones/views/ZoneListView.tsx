import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ErrorMessage } from '../../core'
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

  if (zonas.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (zonas.isError) return <p className="p-6 text-red-600">No se pudieron leer las zonas.</p>

  const items = zonas.data?.items ?? []

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div>
        <Link to="/" className="text-sm text-slate-500 hover:underline">
          ← Panel
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Zonas de reparto</h1>
          <Link
            to="/panel/zonas/nueva"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Nueva zona
          </Link>
        </div>
      </div>

      <ErrorMessage error={error} />

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Todavía no hay zonas. Sin al menos una, el chofer no puede abrir su salida.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((z) => (
            <li
              key={z.id}
              className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{z.name}</p>
                  {z.notes && <p className="text-xs text-slate-500">{z.notes}</p>}
                </div>
                {!z.isActive && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Inactiva
                  </span>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-2 text-xs">
                <Link to={`/panel/zonas/${z.id}`} className="text-slate-700 hover:underline">
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => activar.mutate(z)}
                  disabled={activar.isPending}
                  className="text-slate-700 hover:underline disabled:text-slate-400"
                >
                  {z.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar la zona "${z.name}"?`)) eliminar.mutate(z.id)
                  }}
                  disabled={eliminar.isPending}
                  className="text-red-600 hover:underline disabled:text-slate-400"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

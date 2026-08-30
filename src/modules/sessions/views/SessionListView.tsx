import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../../core'
import { sessionService } from '../services/sessionService'

/** Las salidas, de la mas nueva a la mas vieja. Punto de entrada del admin. */
export function SessionListView() {
  const salidas = useQuery({
    queryKey: ['sessions', 'list'],
    queryFn: () => sessionService.list(1, 30),
  })

  if (salidas.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (salidas.isError) return <p className="p-6 text-red-600">No se pudieron leer las salidas.</p>

  const items = salidas.data?.items ?? []

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-slate-900">Salidas de reparto</h1>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay salidas registradas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                to={`/panel/salidas/${s.id}`}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {s.driverName} · {s.zoneName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(s.openedAt)} · {s.vehicleLicensePlate}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === 'Open'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.status === 'Open' ? 'En la calle' : 'Cerrada'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

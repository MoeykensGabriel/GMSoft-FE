import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../../core'
import { sessionService } from '../services/sessionService'
import { SettlementPanel } from './SettlementPanel'
import { StockOnBoardPanel } from './StockOnBoardPanel'

/**
 * Una salida vista desde la liquidacion: quien la hizo, que quedo colgado y como
 * cerro la plata.
 *
 * Pide la salida por id aunque quien la llama ya la tenga del listado, porque el
 * listado viene sin el stock a bordo: traerlo ahi serian N consultas para una
 * pantalla que solo muestra fechas y estados.
 */
export function SessionSettlementCard({ sessionId }: { sessionId: string }) {
  const sesion = useQuery({
    queryKey: ['sessions', 'detail', sessionId],
    queryFn: () => sessionService.getById(sessionId),
  })

  if (sesion.isLoading) return <p className="text-sm text-slate-500">Cargando la salida...</p>
  if (!sesion.data) return <p className="text-sm text-red-600">No se pudo leer la salida.</p>

  const s = sesion.data
  const cerrada = s.status === 'Closed'

  return (
    <article className="flex flex-col gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {s.driverName} · {s.zoneName}
          </h2>
          <p className="text-xs text-slate-500">
            Salió {formatDateTime(s.openedAt)} con {s.kilometersAtOpen} km
            {s.closedAt && ` · Volvió ${formatDateTime(s.closedAt)} con ${s.kilometersAtClose} km`}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            cerrada ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {cerrada ? 'Cerrada' : 'En la calle'}
        </span>
      </div>

      {!cerrada && (
        <Link
          to={`/panel/salidas/${s.id}/recepcion`}
          className="rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
        >
          Recibir el camión
        </Link>
      )}

      <StockOnBoardPanel stock={s.stock} cerrada={cerrada} />

      <SettlementPanel sessionId={s.id} cerrada={cerrada} />

      <Link
        to={`/panel/salidas/${s.id}`}
        className="text-xs text-slate-500 hover:underline"
      >
        Ver el recorrido completo →
      </Link>
    </article>
  )
}

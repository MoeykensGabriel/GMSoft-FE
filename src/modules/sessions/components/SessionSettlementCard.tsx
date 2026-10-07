import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatDateTime, LinkButton } from '../../core'
import { sessionService } from '../services/sessionService'
import { DetailedSettlementPanel } from './DetailedSettlementPanel'
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

  if (sesion.isLoading) return <p className="text-sm text-muted">Cargando la salida...</p>
  if (!sesion.data) return <p className="text-sm text-danger">No se pudo leer la salida.</p>

  const s = sesion.data
  const cerrada = s.status === 'Closed'

  return (
    <article className="flex flex-col gap-4 ui-card bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">
            {s.driverName} · {s.zoneName}
          </h2>
          <p className="text-xs text-muted">
            Salió {formatDateTime(s.openedAt)} con {s.kilometersAtOpen} km
            {s.closedAt && ` · Volvió ${formatDateTime(s.closedAt)} con ${s.kilometersAtClose} km`}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            cerrada ? 'bg-canvas text-muted' : 'bg-warning-soft text-warning'
          }`}
        >
          {cerrada ? 'Cerrada' : 'En la calle'}
        </span>
      </div>

      {!cerrada && (
        <LinkButton to={`/panel/salidas/${s.id}/recepcion`} variant="primary">
          Recibir el camión
        </LinkButton>
      )}

      <StockOnBoardPanel stock={s.stock} cerrada={cerrada} />

      <SettlementPanel sessionId={s.id} cerrada={cerrada} />

      <DetailedSettlementPanel sessionId={s.id} />

      <Link
        to={`/panel/salidas/${s.id}`}
        className="text-xs text-muted hover:underline"
      >
        Ver el recorrido completo →
      </Link>
    </article>
  )
}

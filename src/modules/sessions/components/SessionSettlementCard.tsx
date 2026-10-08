import { Link } from 'react-router-dom'
import { formatDateTime } from '../../core'
import type { Session } from '../services/sessionService'
import { DetailedSettlementPanel } from './DetailedSettlementPanel'

/**
 * Una salida vista desde la liquidacion: solo lo que se le fue vendiendo a cada
 * cliente. El estado del camion, lo que lleva a bordo y la recepcion viven en
 * Salidas y recepcion.
 */
export function SessionSettlementCard({ session }: { session: Session }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold text-ink">{session.driverName} · {session.zoneName}</h2>
        <Link to={`/panel/salidas/${session.id}`} className="text-xs text-muted hover:underline">
          Salida del {formatDateTime(session.openedAt)} →
        </Link>
      </div>

      <DetailedSettlementPanel sessionId={session.id} />
    </article>
  )
}

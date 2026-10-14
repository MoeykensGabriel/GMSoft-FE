import { useSyncExternalStore } from 'react'
import { Button } from '../../core'
import type { Session } from '../services/sessionService'
import { restockSeenStorage } from '../states/restockSeenStorage'
import { restockTime } from '../utils/restocks'

/** Triángulo de atención: el aviso tiene que verse aunque el chofer esté mirando otra cosa. */
function WarningIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" className="shrink-0 text-warning">
    <path fill="currentColor" d="M12 2.5 1.5 21h21L12 2.5Zm0 4.2L19 19H5l7-12.3ZM11 10v5h2v-5h-2Zm0 6.5v2h2v-2h-2Z" />
  </svg>
}

/**
 * Recargas que ADMIN le sumó al camión y el chofer todavía no vio. Pensado para el
 * celular: un producto por renglón, la cantidad grande a la derecha y el botón a todo
 * el ancho.
 */
export function RestockNotice({ userId, session }: { userId: string; session: Session }) {
  const snapshot = useSyncExternalStore(restockSeenStorage.subscribe,
    () => restockSeenStorage.snapshot(userId, session.id))
  const seen: string[] = JSON.parse(snapshot)
  const unseen = (session.restocks ?? []).filter((restock) => !seen.includes(restock.id))
  if (!unseen.length) return null
  return <section role="status" aria-label="Recargas nuevas" className="flex flex-col gap-4">
    {unseen.map((restock) => <article key={restock.id}
      className="flex flex-col gap-3 rounded-lg border-2 border-warning bg-warning-soft p-4 text-ink">
      <div className="flex items-start gap-3">
        <WarningIcon />
        <div>
          <p className="text-lg font-semibold">Te recargaron el camión</p>
          <p className="text-sm text-muted">A las {restockTime(restock.occurredAt)}</p>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-warning/20 rounded border border-warning/30 bg-surface">
        {(restock.items ?? []).map((item) => <li key={item.productId} className="flex items-baseline justify-between gap-3 px-3 py-2">
          <span className="text-base">{item.productDetail}</span>
          <span className="text-xl font-semibold">{item.quantity}</span>
        </li>)}
      </ul>
      <Button className="w-full" onClick={() => restockSeenStorage.acknowledge(userId, session.id, restock.id)}>Entendido</Button>
    </article>)}
  </section>
}

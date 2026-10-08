import { useSyncExternalStore } from 'react'
import { Badge, Button } from '../../core'
import type { Session } from '../services/sessionService'
import { restockSeenStorage } from '../states/restockSeenStorage'
import { restockProducts, restockTime } from '../utils/restocks'

export function RestockNotice({ userId, session }: { userId: string; session: Session }) {
  const snapshot = useSyncExternalStore(restockSeenStorage.subscribe,
    () => restockSeenStorage.snapshot(userId, session.id))
  const seen: string[] = JSON.parse(snapshot)
  const unseen = (session.restocks ?? []).filter((restock) => !seen.includes(restock.id))
  if (!unseen.length) return null
  return <section role="status" aria-label="Recargas nuevas" className="flex flex-col gap-3 rounded border border-accent bg-accent-soft p-4">
    <div><Badge tone="info">Recarga nueva</Badge></div>
    <ul className="flex flex-col gap-3">
      {unseen.map((restock) => <li key={restock.id} className="flex flex-col gap-2">
        <p>Te recargaron {restockProducts(restock)} a las {restockTime(restock.occurredAt)}</p>
        <Button className="self-end" onClick={() => restockSeenStorage.acknowledge(userId, session.id, restock.id)}>Entendido</Button>
      </li>)}
    </ul>
  </section>
}

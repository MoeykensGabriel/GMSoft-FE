import { BUSINESS_TIME_ZONE, formatDateTime } from '../../core'
import type { SessionRestock } from '../services/sessionService'

export function RestocksPanel({ restocks = [] }: { restocks: SessionRestock[] }) {
  return <section className="flex flex-col gap-2">
    <h3 className="font-medium">Recargas</h3>
    {restocks.length === 0 ? <p className="text-muted">Sin recargas</p> : <ol className="flex flex-col gap-2">
      {restocks.map((restock) => <li key={restock.id} className="ui-card p-3">
        <p className="font-medium">{formatDateTime(restock.occurredAt, BUSINESS_TIME_ZONE)} (hora de Argentina)</p>
        <ul>{restock.items.map((item) => <li key={item.productId}>{item.quantity} × {item.productDetail}</li>)}</ul>
        {restock.notes && <p className="mt-2 whitespace-pre-wrap break-words text-muted">Notas: {restock.notes}</p>}
      </li>)}
    </ol>}
  </section>
}

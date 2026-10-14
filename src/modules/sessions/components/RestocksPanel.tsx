import { BUSINESS_TIME_ZONE, Panel, formatDateTime } from '../../core'
import { OutsideWorkingHoursBadge } from '../../workingHours'
import type { SessionRestock } from '../services/sessionService'

export function RestocksPanel({ restocks = [] }: { restocks: SessionRestock[] }) {
  return <Panel title={`Recargas (${restocks.length})`}>
    {restocks.length === 0 ? <p className="text-muted">Sin recargas en esta salida.</p> : <ol className="flex flex-col gap-3">
      {restocks.map((restock) => <li key={restock.id} className="rounded border border-line px-4 py-3">
        <p className="text-base font-semibold text-ink">{formatDateTime(restock.occurredAt, BUSINESS_TIME_ZONE)} <span className="font-normal text-muted">(hora de Argentina)</span></p>
        <OutsideWorkingHoursBadge marked={restock.isOutsideWorkingHours} />
        <ul className="mt-1 text-base">{restock.items.map((item) => <li key={item.productId}><span className="font-semibold">{item.quantity}</span> × {item.productDetail}</li>)}</ul>
        {restock.notes && <p className="mt-2 whitespace-pre-wrap break-words text-muted">Notas: {restock.notes}</p>}
      </li>)}
    </ol>}
  </Panel>
}

import { BUSINESS_TIME_ZONE, Panel, formatDateTime } from '../../core'
import type { SessionTransfer } from '../services/sessionService'

/** Los pases con otros camiones. Si no hubo ninguno, no ocupa lugar. */
export function TransfersPanel({ transfers = [] }: { transfers?: SessionTransfer[] }) {
  if (transfers.length === 0) return null
  return <Panel title={`Pases entre camiones (${transfers.length})`}>
    <ol className="flex flex-col gap-3">
      {transfers.map((transfer) => <li key={`${transfer.occurredAt}-${transfer.notes}`}
        className={`rounded border-l-4 border border-line px-4 py-3 ${transfer.incoming ? 'border-l-success' : 'border-l-danger'}`}>
        <p className="text-base font-semibold text-ink">{transfer.notes}</p>
        <p className="text-sm text-muted">{formatDateTime(transfer.occurredAt, BUSINESS_TIME_ZONE)}</p>
        <ul className="mt-1 text-base">{transfer.items.map((item) => <li key={item.productId}>
          <span className="font-semibold">{transfer.incoming ? '+' : '−'}{item.quantity}</span> × {item.productDetail}
        </li>)}</ul>
      </li>)}
    </ol>
  </Panel>
}

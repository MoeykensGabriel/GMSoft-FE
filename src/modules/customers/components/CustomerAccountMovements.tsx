import { formatDateTime, formatMoney } from '../../core'
import type { CustomerAccount } from '../services/customerService'

export function CustomerAccountMovements({ account }: { account: CustomerAccount }) {
  return <section className="flex flex-col gap-3" aria-label="Detalle de cuenta">
    <h2 className="font-semibold">Detalle de deuda</h2>
    <p className="text-xs text-muted">Últimos {account.movements.length} movimientos. El saldo pendiente incluye todo el historial.</p>
    {!account.movements.length && <p className="text-sm">Todavía no hay movimientos.</p>}
    <ul className="flex flex-col gap-2">
      {account.movements.map((movement) => <li key={`${movement.type}-${movement.referenceId}`} className="ui-card p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{movement.type === 'Payment' ? 'Pago recibido' : 'Entrega'}</strong><span>{formatMoney(movement.amount)}</span></div>
        <p className="mt-1 text-xs text-muted">{formatDateTime(movement.date)}</p>
        {movement.notes && <p className="mt-1 whitespace-pre-wrap break-words">{movement.notes}</p>}
      </li>)}
    </ul>
  </section>
}

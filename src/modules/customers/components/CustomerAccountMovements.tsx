import { Badge, BUSINESS_TIME_ZONE, DataTable, formatDateTime, formatMoney } from '../../core'
import type { CustomerAccount, CustomerStatementEntry } from '../services/customerService'
import { statementDetail } from '../utils/accountStatement'

const paymentMethods = { Cash: 'Efectivo', Transfer: 'Transferencia', Card: 'Tarjeta' }

function Detail({ entry }: { entry: CustomerStatementEntry }) {
  const { title, details } = statementDetail(entry)
  return <div className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">
    <p className="font-medium text-brand-dark">{title}</p>
    {details.map((detail, index) => <p key={index} className="mt-1 text-xs text-muted">{detail}</p>)}
    {entry.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{entry.notes}</p>}
  </div>
}

function Payments({ entry }: { entry: CustomerStatementEntry }) {
  return entry.payments.length
    ? <div className="flex flex-col gap-1">{entry.payments.map((payment, index) =>
      <p key={index}>{formatMoney(payment.amount)} <span className="text-xs text-muted">{paymentMethods[payment.method]}</span></p>,
    )}</div>
    : <span className="text-muted">—</span>
}

export function CustomerAccountMovements({ account }: { account: CustomerAccount }) {
  const { statement, balance } = account
  return <section className="flex min-w-0 flex-col gap-3" aria-label="Detalle de cuenta">
    <h2 className="font-semibold text-brand-dark">Cuenta corriente</h2>
    <div className={`rounded border p-3 ${balance > 0 ? 'border-warning/30 bg-warning-soft text-warning' : 'border-accent/30 bg-accent-soft text-brand-dark'}`}>
      <p className="text-xl font-semibold">{balance > 0 ? `Debe ${formatMoney(balance)}` : balance < 0 ? `Saldo a favor ${formatMoney(Math.abs(balance))}` : 'Al día'}</p>
    </div>
    {!statement.length ? <p className="text-sm text-muted">Todavía no hay movimientos.</p> : <>
      <div className="hidden md:block">
        <DataTable stack={false} label="Movimientos de la cuenta corriente" className="table-fixed">
          <thead><tr><th scope="col" className="w-[18%]">Fecha</th><th scope="col" className="w-[34%]">Detalle</th><th scope="col" className="w-[14%]">Debe</th><th scope="col" className="w-[20%]">Pagó</th><th scope="col" className="w-[14%]">Saldo</th></tr></thead>
          <tbody>{statement.map((entry) => <tr key={`${entry.kind}-${entry.referenceId}`}>
            <td><time dateTime={entry.date}>{formatDateTime(entry.date, BUSINESS_TIME_ZONE)}</time></td>
            <td><Detail entry={entry} /></td>
            <td className="tabular-nums">{entry.charge ? formatMoney(entry.charge) : '—'}</td>
            <td className="tabular-nums"><Payments entry={entry} /></td>
            <td className={`font-semibold tabular-nums ${entry.balanceAfter > 0 ? 'text-warning' : 'text-brand-dark'}`}>{formatMoney(entry.balanceAfter)}</td>
          </tr>)}</tbody>
        </DataTable>
      </div>
      <ul className="flex min-w-0 flex-col gap-2 md:hidden">
        {statement.map((entry) => <li key={`${entry.kind}-${entry.referenceId}`} className="ui-card min-w-0 p-3 text-sm [overflow-wrap:anywhere]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <time className="text-xs text-muted" dateTime={entry.date}>{formatDateTime(entry.date, BUSINESS_TIME_ZONE)}</time>
            <Badge tone={entry.balanceAfter > 0 ? 'warning' : 'info'}>Saldo {formatMoney(entry.balanceAfter)}</Badge>
          </div>
          <Detail entry={entry} />
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line pt-2 tabular-nums">
            <dt className="text-muted">Debe</dt><dd>{entry.charge ? formatMoney(entry.charge) : '—'}</dd>
            <dt className="text-muted">Pagó</dt><dd><Payments entry={entry} /></dd>
          </dl>
        </li>)}
      </ul>
    </>}
    {account.statementTotalCount > statement.length && <p className="text-xs text-muted">Mostrando {statement.length} de {account.statementTotalCount} movimientos</p>}
  </section>
}

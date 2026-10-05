import { useQuery } from '@tanstack/react-query'
import { customerService } from '../services/customerService'
import type { Customer } from '../services/customerService'
import { CustomerContainersSummary } from './CustomerContainersSummary'
import { formatMoney } from '../../core'

export function CustomerCard({ customer, onSelect }: {
  customer: Customer
  onSelect: (id: string) => void
}) {
  const account = useQuery({
    queryKey: ['customers', 'account', customer.id],
    queryFn: () => customerService.getAccount(customer.id),
  })
  return (
    <button
      type="button"
      onClick={() => onSelect(customer.id)}
      aria-label={`Registrar visita a ${customer.displayName}`}
      className={`w-full border-b border-neutral-200 px-2 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${customer.activityStatus === 'Black' ? 'bg-neutral-900 text-white' : customer.activityStatus === 'Red' ? 'bg-red-50 text-neutral-900' : 'bg-white text-neutral-900 hover:bg-neutral-50'}`}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-2 text-sm">
        <span className="min-w-0 break-words font-semibold">{customer.displayName}</span>
        <span className="min-w-0 break-words">{customer.address}</span>
        <span className="min-w-0 break-words text-right font-medium">
          {account.isError ? 'Sin datos' : account.data ? <>{account.data.balance < 0 && <span className="block text-xs">A favor</span>}{formatMoney(Math.abs(account.data.balance))}</> : '…'}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs">
        <span>{customer.daysWithoutPurchase === null ? 'Sin compras registradas' : `${customer.daysWithoutPurchase} días sin comprar`}</span>
        <span className="min-w-0 break-words">{account.data ? <CustomerContainersSummary account={account.data} /> : account.isError ? 'No se pudieron leer los envases' : 'Cargando envases…'}</span>
      </div>
      {customer.visitDays == null && <span className="mt-1 block text-xs">Días pendientes de configurar</span>}
    </button>
  )
}

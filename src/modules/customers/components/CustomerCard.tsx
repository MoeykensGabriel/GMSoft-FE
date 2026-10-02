import { useQuery } from '@tanstack/react-query'
import { customerService } from '../services/customerService'
import type { Customer } from '../services/customerService'
import { CustomerAccountSummary } from './CustomerAccountSummary'

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
      className="w-full rounded-md border border-neutral-300 bg-white p-4 text-left hover:bg-neutral-50"
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 break-words">
          <h2 className="font-semibold">{customer.routeOrder}. {customer.displayName}</h2>
          <p className="mt-1 text-sm">{customer.address}</p>
          <p className="mt-2 text-sm text-neutral-600">
            {customer.daysWithoutPurchase === null
              ? 'Sin compras registradas'
              : `Días sin comprar: ${customer.daysWithoutPurchase}`}
          </p>
        </div>
        <div className="min-w-0 break-words">
          {account.isError ? <p className="text-sm text-red-700">No se pudo leer el saldo. Se consultará al abrir la visita.</p>
            : account.data ? <CustomerAccountSummary account={account.data} />
              : <p className="text-sm text-neutral-600">Cargando saldos y envases…</p>}
        </div>
      </div>
      <span className="mt-3 block text-sm underline">Tocar para registrar visita</span>
    </button>
  )
}

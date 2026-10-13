import { useQuery } from '@tanstack/react-query'
import { Button, ErrorMessage } from '../../core'
import { purchaseActivityLabel } from '../../customers'
import { sessionService } from '../services/sessionService'

export function UnvisitedCustomersPanel({ sessionId, notice = false }: { sessionId: string; notice?: boolean }) {
  const query = useQuery({
    queryKey: ['sessions', 'unvisited-customers', sessionId],
    queryFn: () => sessionService.getUnvisitedCustomers(sessionId),
    staleTime: 0, refetchInterval: 30_000,
  })
  if (query.isPending) return <p role="status">Consultando clientes sin visitar…</p>
  if (query.isError) return <div className="ui-card p-3"><ErrorMessage error={query.error} />
    <Button type="button" variant="secondary" onClick={() => { void query.refetch() }}>Reintentar consulta de sin visitar</Button></div>
  const { items, total } = query.data
  return <details className="ui-card p-3" open={notice ? undefined : total <= 5}>
    <summary className="cursor-pointer py-2 font-semibold">{notice ? `Quedaron ${total} clientes sin visitar` : `Sin visitar (${total})`}</summary>
    {notice && <p className="my-2 text-sm text-muted">Este aviso no impide recibir el camión.</p>}
    {total === 0 ? <p className="text-sm">Todos los clientes del recorrido tienen una visita registrada.</p> :
      <ul className="divide-y divide-line">{items.map((customer) => <li key={customer.id} className="py-3">
        <p className="font-medium">{customer.displayName}</p>
        <p className="text-sm">{customer.address} · {customer.phone}</p>
        <p className="text-sm text-muted">{purchaseActivityLabel(customer.weeksWithoutPurchase, customer.lastPurchaseAt === null)}</p>
      </li>)}</ul>}
    <p className="mt-2 text-xs text-muted">Según la asignación actual de camión, zona y días de los clientes.</p>
  </details>
}
